import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = (
    create_async_engine(
        DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={"ssl": "require"},
    )
    if DATABASE_URL
    else None
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False) if engine else None


class Base(DeclarativeBase):
    pass


async def get_db():
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure unique constraint exists on repos so bulk upsert works.
        # Cleans duplicates first so the ALTER TABLE never fails on existing data.
        await conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'uq_repo_user_github'
                ) THEN
                    DELETE FROM repos r1
                    USING repos r2
                    WHERE r1.user_id = r2.user_id
                      AND r1.github_repo_id = r2.github_repo_id
                      AND r1.id > r2.id;
                    ALTER TABLE repos
                        ADD CONSTRAINT uq_repo_user_github UNIQUE (user_id, github_repo_id);
                END IF;
            END $$;
        """))
