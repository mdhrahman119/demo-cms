"""Add discount and rejection features

Revision ID: b82d7d579305
Revises: 5c3bf9bbdec3
Create Date: 2025-08-25 04:14:24.976375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b82d7d579305'
down_revision: Union[str, Sequence[str], None] = '5c3bf9bbdec3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('invoices', sa.Column(
        'subtotal_amount', sa.Numeric(10, 3), nullable=False, server_default="0.000"
    ))
    op.add_column('invoices', sa.Column(
        'discount_amount', sa.Numeric(10, 3), nullable=False, server_default="0.000"
    ))
    op.add_column('invoices', sa.Column(
        'is_rejected', sa.Boolean(), nullable=False, server_default=sa.text('false')
    ))
    op.add_column('invoices', sa.Column(
        'rejection_reason', sa.String(), nullable=True
    ))

def downgrade() -> None:
    op.drop_column('invoices', 'rejection_reason')
    op.drop_column('invoices', 'is_rejected')
    op.drop_column('invoices', 'discount_amount')
    op.drop_column('invoices', 'subtotal_amount')