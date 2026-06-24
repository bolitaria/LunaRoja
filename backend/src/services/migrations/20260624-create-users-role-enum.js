module.exports = {
  up: async (queryInterface, Sequelize, transaction) => {
    await queryInterface.sequelize.query(
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
          CREATE TYPE "public"."enum_Users_role" AS ENUM ('superadmin', 'campaign_admin', 'action_admin');
        END IF;
      END
      $$;`,
      { transaction },
    );

    const hasUsers = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'role' LIMIT 1;`,
      { transaction },
    );

    if (hasUsers[0].length === 0) {
      return;
    }

    await queryInterface.sequelize.query(
      `UPDATE "Users"
      SET role = (
        CASE
          WHEN role::text = 'admin' THEN 'superadmin'
          WHEN role::text NOT IN ('superadmin', 'campaign_admin', 'action_admin') THEN 'action_admin'
          ELSE role::text
        END
      )::"public"."enum_Users_role"
      WHERE role IS NOT NULL;`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT;`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" TYPE "public"."enum_Users_role"
        USING ("role"::text::"public"."enum_Users_role");`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'action_admin'::"public"."enum_Users_role";`,
      { transaction },
    );
  },
};
