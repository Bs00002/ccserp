import psycopg2

PRIMARY_CONN = "postgresql://ccs_user:ccs_secure_pass_2026@127.0.0.1:5432/ccs"
RESTORE_CONN = "postgresql://ccs_user:ccs_secure_pass_2026@127.0.0.1:5432/ccs_restore_test"

def verify():
    p_conn = psycopg2.connect(PRIMARY_CONN)
    r_conn = psycopg2.connect(RESTORE_CONN)
    p_cur = p_conn.cursor()
    r_cur = r_conn.cursor()

    tables = [
        "django_migrations",
        "accounts_user",
        "accounts_dealerprofile",
        "accounts_distributorprofile",
        "accounts_employeeprofile",
        "products_category",
        "products_product",
        "inventory_warehouse",
        "inventory_stockledger",
        "orders_order",
        "orders_orderitem",
        "orders_ordertimeline",
        "orders_invoice",
        "wallet_wallet",
        "wallet_ledgerentry",
        "wallet_payment",
        "support_complaint",
        "support_returnrequest",
        "support_enquiry",
        "hr_attendance",
        "hr_dealervisit",
        "hr_expense",
        "notifications_notification"
    ]

    print(f"{'Table':<35} | {'Primary DB':<12} | {'Restored DB':<12} | Match")
    print("-" * 75)
    all_matched = True
    for t in tables:
        p_cur.execute(f"SELECT COUNT(*) FROM {t}")
        p_cnt = p_cur.fetchone()[0]
        r_cur.execute(f"SELECT COUNT(*) FROM {t}")
        r_cnt = r_cur.fetchone()[0]
        match = (p_cnt == r_cnt)
        if not match:
            all_matched = False
        print(f"{t:<35} | {p_cnt:<12} | {r_cnt:<12} | {'PASS' if match else 'FAIL'}")

    print("\nRepresentative Read Queries on Restored Database:")
    r_cur.execute("SELECT id, email, role, is_active FROM accounts_user ORDER BY email LIMIT 5")
    print("  Users sample:", r_cur.fetchall())

    r_cur.execute("SELECT id, name, mrp FROM products_product LIMIT 3")
    print("  Products sample:", r_cur.fetchall())

    r_cur.execute("SELECT order_number, status, grand_total FROM orders_order LIMIT 3")
    print("  Orders sample:", r_cur.fetchall())

    r_cur.execute("SELECT invoice_number, generated_at FROM orders_invoice LIMIT 3")
    print("  Invoices sample:", r_cur.fetchall())

    r_cur.execute("SELECT method, transaction_id, status FROM wallet_payment LIMIT 3")
    print("  Payments sample:", r_cur.fetchall())

    r_cur.execute("SELECT reference, type, quantity FROM inventory_stockledger LIMIT 3")
    print("  Stock Ledger sample:", r_cur.fetchall())

    # Orphan checks in restored DB
    print("\nOrphan and FK Integrity Checks on Restored DB:")
    # Orphan order items
    r_cur.execute("""
        SELECT COUNT(*) FROM orders_orderitem oi 
        LEFT JOIN orders_order o ON oi.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphan_items = r_cur.fetchone()[0]
    print(f"  Orphaned Order Items: {orphan_items}")

    # Orphan invoices
    r_cur.execute("""
        SELECT COUNT(*) FROM orders_invoice i 
        LEFT JOIN orders_order o ON i.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphan_inv = r_cur.fetchone()[0]
    print(f"  Orphaned Invoices: {orphan_inv}")

    # Orphan ledger entries
    r_cur.execute("""
        SELECT COUNT(*) FROM wallet_ledgerentry le 
        LEFT JOIN wallet_wallet w ON le.wallet_id = w.id 
        WHERE w.id IS NULL
    """)
    orphan_ledger = r_cur.fetchone()[0]
    print(f"  Orphaned Ledger Entries: {orphan_ledger}")

    # Orphan payments
    r_cur.execute("""
        SELECT COUNT(*) FROM wallet_payment p 
        LEFT JOIN wallet_ledgerentry le ON p.ledger_entry_id = le.id 
        WHERE p.ledger_entry_id IS NOT NULL AND le.id IS NULL
    """)
    orphan_payments = r_cur.fetchone()[0]
    print(f"  Orphaned Payments: {orphan_payments}")

    # Orphan dealer profiles
    r_cur.execute("""
        SELECT COUNT(*) FROM accounts_dealerprofile dp 
        LEFT JOIN accounts_user u ON dp.user_id = u.id 
        WHERE u.id IS NULL
    """)
    orphan_dp = r_cur.fetchone()[0]
    print(f"  Orphaned Dealer Profiles: {orphan_dp}")

    p_cur.close()
    r_cur.close()
    p_conn.close()
    r_conn.close()

    print(f"\nOVERALL RESTORE VERIFICATION: {'SUCCESS' if all_matched and orphan_items==0 and orphan_inv==0 and orphan_ledger==0 and orphan_payments==0 else 'FAILED'}")

if __name__ == '__main__':
    verify()
