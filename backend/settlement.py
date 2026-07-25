def minimize_cash_flow(balances):
    """
    balances: dict mapping user_id to net_balance.
    net_balance > 0 means the user is owed money (creditor)
    net_balance < 0 means the user owes money (debtor)
    """
    creditors = []
    debtors = []
    
    for user_id, amount in balances.items():
        if amount > 0:
            creditors.append([user_id, float(amount)])
        elif amount < 0:
            debtors.append([user_id, float(-amount)])
            
    # sort descending so we match largest debtor with largest creditor
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)
    
    transactions = []
    
    i = 0
    j = 0
    
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_amount = debtors[i]
        creditor_id, credit_amount = creditors[j]
        
        settle_amount = min(debt_amount, credit_amount)
        
        transactions.append({
            'from_user_id': debtor_id,
            'to_user_id': creditor_id,
            'amount': settle_amount
        })
        
        debtors[i][1] -= settle_amount
        creditors[j][1] -= settle_amount
        
        # using a small epsilon to handle float precision issues
        if debtors[i][1] < 1e-5:
            i += 1
        if creditors[j][1] < 1e-5:
            j += 1
            
    return transactions
