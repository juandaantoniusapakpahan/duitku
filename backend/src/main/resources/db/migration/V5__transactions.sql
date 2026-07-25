CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    description VARCHAR(255),
    notes TEXT,
    account_id UUID REFERENCES accounts(id),
    from_account_id UUID REFERENCES accounts(id),
    to_account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    fee NUMERIC(18,2) NOT NULL DEFAULT 0,
    fee_category_id UUID REFERENCES categories(id),
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule VARCHAR(255),
    parent_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_occurred_at ON transactions (occurred_at);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_parent ON transactions (parent_transaction_id);
