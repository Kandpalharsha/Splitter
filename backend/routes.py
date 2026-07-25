from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from models import db, User, Group, GroupMember, Expense, ExpenseSplit
from sqlalchemy import text
from datetime import datetime
from settlement import minimize_cash_flow

api_bp = Blueprint('api', __name__)

def check_group_membership(group_id, user_id):
    return GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first() is not None

@api_bp.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not email or not password or not full_name:
        return jsonify({"message": "Email, full name, and password are required"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400
        
    hashed = generate_password_hash(password)
    new_user = User(email=email, full_name=full_name, password_hash=hashed)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401
        
    access_token = create_access_token(identity=str(user.id))
    response = jsonify({"message": "Login successful", "user_id": user.id})
    set_access_cookies(response, access_token)
    return response, 200

@api_bp.route('/auth/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200
@api_bp.route('/groups', methods=['GET'])
@jwt_required()
def get_groups():
    user_id = int(get_jwt_identity())
    # get groups user belongs to
    memberships = GroupMember.query.filter_by(user_id=user_id).all()
    group_ids = [m.group_id for m in memberships]
    groups = Group.query.filter(Group.id.in_(group_ids)).all()
    
    return jsonify([{"id": g.id, "name": g.name} for g in groups]), 200

@api_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    name = data.get('name')
    
    new_group = Group(name=name)
    db.session.add(new_group)
    db.session.commit()
    
    # Add creator to group
    db.session.add(GroupMember(user_id=user_id, group_id=new_group.id))
    db.session.commit()
    
    return jsonify({"id": new_group.id, "name": new_group.name}), 201

@api_bp.route('/groups/<int:group_id>/members', methods=['GET'])
@jwt_required()
def get_members(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403
        
    memberships = GroupMember.query.filter_by(group_id=group_id).all()
    user_ids = [m.user_id for m in memberships]
    users = User.query.filter(User.id.in_(user_ids)).all()
    return jsonify([{"id": u.id, "email": u.email, "full_name": u.full_name} for u in users]), 200

@api_bp.route('/groups/<int:group_id>/members', methods=['POST'])
@jwt_required()
def add_member(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if GroupMember.query.filter_by(user_id=user.id, group_id=group_id).first():
        return jsonify({"message": "User already in group"}), 400
        
    db.session.add(GroupMember(user_id=user.id, group_id=group_id))
    db.session.commit()
    
    return jsonify({"message": "Member added"}), 200

@api_bp.route('/groups/<int:group_id>/expenses', methods=['GET'])
@jwt_required()
def get_expenses(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403
        
    expenses = Expense.query.filter_by(group_id=group_id).order_by(Expense.date.desc()).all()
    res = []
    
    # Get user emails for display
    payer_ids = {e.payer_id for e in expenses}
    users = User.query.filter(User.id.in_(payer_ids)).all()
    email_map = {u.id: u.email for u in users}
    name_map = {u.id: u.full_name for u in users}
    
    # Fetch splits for current user
    expense_ids = [e.id for e in expenses]
    splits = ExpenseSplit.query.filter(ExpenseSplit.expense_id.in_(expense_ids), ExpenseSplit.user_id == user_id).all() if expense_ids else []
    split_map = {s.expense_id: float(s.amount_owed) for s in splits}
    
    for e in expenses:
        res.append({
            "id": e.id,
            "payer_id": e.payer_id,
            "payer_email": email_map.get(e.payer_id),
            "payer_name": name_map.get(e.payer_id),
            "description": e.description,
            "amount": float(e.amount),
            "date": e.date.strftime("%Y-%m-%d"),
            "user_share": split_map.get(e.id, 0.0)
        })
    return jsonify(res), 200

@api_bp.route('/groups/<int:group_id>/expenses', methods=['POST'])
@jwt_required()
def add_expense(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    
    payer_id = user_id
    description = data.get('description')
    amount = data.get('amount')
    date_str = data.get('date')
    splits = data.get('splits')
    
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        date_obj = datetime.utcnow().date()
        
    expense = Expense(
        group_id=group_id,
        payer_id=payer_id,
        description=description,
        amount=amount,
        date=date_obj
    )
    db.session.add(expense)
    db.session.commit()
    
    for split in splits:
        s = ExpenseSplit(
            expense_id=expense.id,
            user_id=split['user_id'],
            amount_owed=split['amount_owed']
        )
        db.session.add(s)
        
    db.session.commit()
    return jsonify({"message": "Expense added successfully", "expense_id": expense.id}), 201

@api_bp.route('/groups/<int:group_id>/balances', methods=['GET'])
@jwt_required()
def get_balances(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403

    query = text("""
        SELECT 
            u.id as user_id, 
            u.email,
            u.full_name,
            COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) as net_balance
        FROM GroupMembers gm
        JOIN Users u ON gm.user_id = u.id
        LEFT JOIN (
            SELECT payer_id, SUM(amount) as total_paid
            FROM Expenses
            WHERE group_id = :group_id
            GROUP BY payer_id
        ) paid ON u.id = paid.payer_id
        LEFT JOIN (
            SELECT es.user_id, SUM(es.amount_owed) as total_owed
            FROM ExpenseSplits es
            JOIN Expenses e ON es.expense_id = e.id
            WHERE e.group_id = :group_id
            GROUP BY es.user_id
        ) owed ON u.id = owed.user_id
        WHERE gm.group_id = :group_id
    """)
    
    result = db.session.execute(query, {'group_id': group_id})
    balances = []
    for row in result:
        balances.append({
            "user_id": row.user_id,
            "email": row.email,
            "full_name": row.full_name,
            "net_balance": float(row.net_balance)
        })
        
    return jsonify(balances), 200

@api_bp.route('/groups/<int:group_id>/settlements', methods=['GET'])
@jwt_required()
def get_settlements(group_id):
    user_id = int(get_jwt_identity())
    if not check_group_membership(group_id, user_id):
        return jsonify({"message": "Unauthorized"}), 403

    query = text("""
        SELECT 
            u.id as user_id, 
            COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) as net_balance
        FROM GroupMembers gm
        JOIN Users u ON gm.user_id = u.id
        LEFT JOIN (
            SELECT payer_id, SUM(amount) as total_paid
            FROM Expenses
            WHERE group_id = :group_id
            GROUP BY payer_id
        ) paid ON u.id = paid.payer_id
        LEFT JOIN (
            SELECT es.user_id, SUM(es.amount_owed) as total_owed
            FROM ExpenseSplits es
            JOIN Expenses e ON es.expense_id = e.id
            WHERE e.group_id = :group_id
            GROUP BY es.user_id
        ) owed ON u.id = owed.user_id
        WHERE gm.group_id = :group_id
    """)
    
    result = db.session.execute(query, {'group_id': group_id})
    balance_dict = {}
    for row in result:
        balance_dict[row.user_id] = float(row.net_balance)
        
    transactions = minimize_cash_flow(balance_dict)
    
    user_ids = set()
    for t in transactions:
        user_ids.add(t['from_user_id'])
        user_ids.add(t['to_user_id'])
        
    users = User.query.filter(User.id.in_(user_ids)).all()
    email_map = {u.id: u.email for u in users}
    name_map = {u.id: u.full_name for u in users}
    
    for t in transactions:
        t['from_email'] = email_map.get(t['from_user_id'])
        t['to_email'] = email_map.get(t['to_user_id'])
        t['from_name'] = name_map.get(t['from_user_id'])
        t['to_name'] = name_map.get(t['to_user_id'])
        
    return jsonify(transactions), 200

@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    
    # 1. Overall Balance
    paid = db.session.query(db.func.sum(Expense.amount)).filter(Expense.payer_id == user_id).scalar() or 0
    owed = db.session.query(db.func.sum(ExpenseSplit.amount_owed)).filter(ExpenseSplit.user_id == user_id).scalar() or 0
    overall_balance = float(paid) - float(owed)
    
    # 2. Friends Breakdown
    groups = GroupMember.query.filter_by(user_id=user_id).all()
    group_ids = [g.group_id for g in groups]
    
    you_owe = {}
    you_are_owed = {}
    
    for gid in group_ids:
        query_group = text("""
            SELECT 
                u.id as user_id, 
                COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) as net_balance
            FROM GroupMembers gm
            JOIN Users u ON gm.user_id = u.id
            LEFT JOIN (
                SELECT payer_id, SUM(amount) as total_paid
                FROM Expenses
                WHERE group_id = :group_id
                GROUP BY payer_id
            ) paid ON u.id = paid.payer_id
            LEFT JOIN (
                SELECT es.user_id, SUM(es.amount_owed) as total_owed
                FROM ExpenseSplits es
                JOIN Expenses e ON es.expense_id = e.id
                WHERE e.group_id = :group_id
                GROUP BY es.user_id
            ) owed ON u.id = owed.user_id
            WHERE gm.group_id = :group_id
        """)
        group_result = db.session.execute(query_group, {'group_id': gid})
        balance_dict = {}
        for row in group_result:
            balance_dict[row.user_id] = float(row.net_balance)
            
        transactions = minimize_cash_flow(balance_dict)
        
        user_ids = set()
        for t in transactions:
            user_ids.add(t['from_user_id'])
            user_ids.add(t['to_user_id'])
            
        users = User.query.filter(User.id.in_(user_ids)).all() if user_ids else []
        name_map = {u.id: u.full_name for u in users}
        
        for t in transactions:
            if t['from_user_id'] == user_id:
                # user owes someone
                name = name_map[t['to_user_id']]
                you_owe[name] = you_owe.get(name, 0) + t['amount']
            elif t['to_user_id'] == user_id:
                # someone owes user
                name = name_map[t['from_user_id']]
                you_are_owed[name] = you_are_owed.get(name, 0) + t['amount']
                
    # Filter out 0 amounts and round
    you_owe = {k: round(v, 2) for k, v in you_owe.items() if v > 0.01}
    you_are_owed = {k: round(v, 2) for k, v in you_are_owed.items() if v > 0.01}
    
    return jsonify({
        "overall_balance": overall_balance,
        "you_owe": you_owe,
        "you_are_owed": you_are_owed
    }), 200
