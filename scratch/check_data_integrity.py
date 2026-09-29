import psycopg2

CONN_STR = "postgresql://ccs_user:ccs_secure_pass_2026@127.0.0.1:5432/ccs"

def audit_integrity():
    conn = psycopg2.connect(CONN_STR)
    cur = conn.cursor()

    findings = []

    # 1. Orphaned order items
    cur.execute("""
        SELECT COUNT(*) FROM orders_orderitem oi 
        LEFT JOIN orders_order o ON oi.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphan_items = cur.fetchone()[0]
    findings.append(("Orphaned Order Items", orphan_items, "orders_orderitem without valid orders_order"))

    # 2. Orphaned invoices
    cur.execute("""
        SELECT COUNT(*) FROM orders_invoice i 
        LEFT JOIN orders_order o ON i.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphan_invoices = cur.fetchone()[0]
    findings.append(("Orphaned Invoices", orphan_invoices, "orders_invoice without valid orders_order"))

    # 3. Orphaned payments
    cur.execute("""
        SELECT COUNT(*) FROM wallet_payment p 
        LEFT JOIN wallet_ledgerentry le ON p.ledger_entry_id = le.id 
        WHERE p.ledger_entry_id IS NOT NULL AND le.id IS NULL
    """)
    orphan_payments = cur.fetchone()[0]
    findings.append(("Orphaned Payments", orphan_payments, "wallet_payment with broken ledger_entry_id"))

    # 4. Orphaned ledger entries
    cur.execute("""
        SELECT COUNT(*) FROM wallet_ledgerentry le 
        LEFT JOIN wallet_wallet w ON le.wallet_id = w.id 
        WHERE w.id IS NULL
    """)
    orphan_ledger = cur.fetchone()[0]
    findings.append(("Orphaned Ledger Entries", orphan_ledger, "wallet_ledgerentry without valid wallet_wallet"))

    # 5. Orphaned stock movements
    cur.execute("""
        SELECT COUNT(*) FROM inventory_stockledger sl
        LEFT JOIN products_product p ON sl.product_id = p.id
        WHERE p.id IS NULL
    """)
    orphan_stock_p = cur.fetchone()[0]
    cur.execute("""
        SELECT COUNT(*) FROM inventory_stockledger sl
        LEFT JOIN inventory_warehouse w ON sl.warehouse_id = w.id
        WHERE sl.warehouse_id IS NOT NULL AND w.id IS NULL
    """)
    orphan_stock_w = cur.fetchone()[0]
    findings.append(("Orphaned Stock Movements (Product)", orphan_stock_p, "inventory_stockledger without valid product"))
    findings.append(("Orphaned Stock Movements (Warehouse)", orphan_stock_w, "inventory_stockledger with broken warehouse_id"))

    # 6. Orphaned dealer/distributor relationships
    cur.execute("""
        SELECT COUNT(*) FROM accounts_dealerprofile dp
        LEFT JOIN accounts_user u ON dp.assigned_distributor_id = u.id
        WHERE dp.assigned_distributor_id IS NOT NULL AND u.id IS NULL
    """)
    orphan_dist_rel = cur.fetchone()[0]
    cur.execute("""
        SELECT COUNT(*) FROM accounts_dealerprofile dp
        LEFT JOIN accounts_user u ON dp.assigned_employee_id = u.id
        WHERE dp.assigned_employee_id IS NOT NULL AND u.id IS NULL
    """)
    orphan_emp_rel = cur.fetchone()[0]
    findings.append(("Broken Dealer->Distributor Links", orphan_dist_rel, "assigned_distributor_id not in accounts_user"))
    findings.append(("Broken Dealer->Employee Links", orphan_emp_rel, "assigned_employee_id not in accounts_user"))

    # 7. Check for broken foreign keys in database
    cur.execute("""
        SELECT conname, conrelid::regclass AS table_name 
        FROM pg_constraint 
        WHERE contype = 'f' AND NOT convalidated
    """)
    unvalidated_fks = cur.fetchall()
    findings.append(("Unvalidated Foreign Keys", len(unvalidated_fks), "PostgreSQL constraints marked invalid"))

    # 8. User Role relationships
    cur.execute("""
        SELECT u.id, u.email, u.role FROM accounts_user u
        LEFT JOIN accounts_dealerprofile dp ON dp.user_id = u.id
        WHERE u.role = 'Dealer' AND dp.id IS NULL AND u.is_active = true
    """)
    active_dealers_without_profile = cur.fetchall()
    findings.append(("Active Dealers Without Profile", len(active_dealers_without_profile), "Dealers active with no profile"))

    print("=" * 80)
    print(f"{'Check Description':<40} | {'Count':<8} | Status")
    print("=" * 80)
    all_clean = True
    for name, cnt, details in findings:
        status = "CLEAN" if cnt == 0 else f"FLAGGED ({cnt})"
        if cnt != 0:
            all_clean = False
        print(f"{name:<40} | {cnt:<8} | {status}")
    print("=" * 80)
    print(f"OVERALL INTEGRITY STATUS: {'100% CLEAN' if all_clean else 'ISSUES FOUND'}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    audit_integrity()
