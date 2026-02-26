"""add indexes to tables

Revision ID: 182151d33b0e
Revises: ab9425b8b9ea
Create Date: 2026-02-25 16:18:28.523039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '182151d33b0e'
down_revision: Union[str, Sequence[str], None] = 'ab9425b8b9ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:

    # ===============================
    # ISSUES
    # ===============================

    op.create_index(
        "uq_issue_default_slug",
        "issues",
        ["slug"],
        unique=True,
        postgresql_where=sa.text("outlet_id IS NULL"),
    )

    op.create_index(
        "ix_issue_outlet_id",
        "issues",
        ["outlet_id"],
    )

    op.create_index(
        "ix_issue_outlet_slug",
        "issues",
        ["outlet_id", "slug"],
    )

    # ===============================
    # CATEGORIES
    # ===============================

    op.create_index(
        "uq_category_default_slug",
        "categories",
        ["slug"],
        unique=True,
        postgresql_where=sa.text("outlet_id IS NULL"),
    )

    op.create_index(
        "ix_category_outlet_id",
        "categories",
        ["outlet_id"],
    )

    op.create_index(
        "ix_category_outlet_slug",
        "categories",
        ["outlet_id", "slug"],
    )

    # ===============================
    # SUB CATEGORIES
    # ===============================

    op.create_index(
        "uq_sub_category_default_slug",
        "sub_categories",
        ["slug"],
        unique=True,
        postgresql_where=sa.text("outlet_id IS NULL"),
    )

    op.create_index(
        "ix_sub_category_outlet_id",
        "sub_categories",
        ["outlet_id"],
    )

    op.create_index(
        "ix_sub_category_outlet_slug",
        "sub_categories",
        ["outlet_id", "slug"],
    )

    # ===============================
    # OUTLET ISSUE CATEGORY MAP
    # ===============================

    op.create_index(
        "uq_issue_category_default",
        "outlet_issue_category_map",
        ["issue_id", "category_id"],
        unique=True,
        postgresql_where=sa.text("outlet_id IS NULL"),
    )

    op.create_index(
        "ix_issue_category_lookup",
        "outlet_issue_category_map",
        ["outlet_id", "issue_id"],
    )

    op.create_index(
        "ix_issue_id",
        "outlet_issue_category_map",
        ["issue_id"],
    )

    op.create_index(
        "ix_category_id",
        "outlet_issue_category_map",
        ["category_id"],
    )

    # ===============================
    # OUTLET CATEGORY SUBCATEGORY MAP
    # ===============================

    op.create_index(
        "uq_category_sub_category_default",
        "outlet_category_subcategory_map",
        ["category_id", "sub_category_id"],
        unique=True,
        postgresql_where=sa.text("outlet_id IS NULL"),
    )

    op.create_index(
        "ix_category_subcategory_lookup",
        "outlet_category_subcategory_map",
        ["outlet_id", "category_id"],
    )

    op.create_index(
        "ix_category_id_sub_map",
        "outlet_category_subcategory_map",
        ["category_id"],
    )

    op.create_index(
        "ix_sub_category_id_sub_map",
        "outlet_category_subcategory_map",
        ["sub_category_id"],
    )


def downgrade() -> None:

    op.drop_index("ix_sub_category_id_sub_map", table_name="outlet_category_subcategory_map")
    op.drop_index("ix_category_id_sub_map", table_name="outlet_category_subcategory_map")
    op.drop_index("ix_category_subcategory_lookup", table_name="outlet_category_subcategory_map")
    op.drop_index("uq_category_sub_category_default", table_name="outlet_category_subcategory_map")

    op.drop_index("ix_category_id", table_name="outlet_issue_category_map")
    op.drop_index("ix_issue_id", table_name="outlet_issue_category_map")
    op.drop_index("ix_issue_category_lookup", table_name="outlet_issue_category_map")
    op.drop_index("uq_issue_category_default", table_name="outlet_issue_category_map")

    op.drop_index("ix_sub_category_outlet_slug", table_name="sub_categories")
    op.drop_index("ix_sub_category_outlet_id", table_name="sub_categories")
    op.drop_index("uq_sub_category_default_slug", table_name="sub_categories")

    op.drop_index("ix_category_outlet_slug", table_name="categories")
    op.drop_index("ix_category_outlet_id", table_name="categories")
    op.drop_index("uq_category_default_slug", table_name="categories")

    op.drop_index("ix_issue_outlet_slug", table_name="issues")
    op.drop_index("ix_issue_outlet_id", table_name="issues")
    op.drop_index("uq_issue_default_slug", table_name="issues")