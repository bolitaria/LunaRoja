module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);
    await query(`DO 'BEGIN CREATE TYPE "public"."enum_links_category" AS ENUM(''local'', ''nacional'', ''europeo'', ''internacional'', ''literatura''); EXCEPTION WHEN duplicate_object THEN null; END'`);
    await query(`ALTER TABLE "links" ALTER COLUMN "category" DROP DEFAULT`);
    await query(`ALTER TABLE "links" ALTER COLUMN "category" TYPE "public"."enum_links_category" USING (category::"public"."enum_links_category")`);
    await query(`ALTER TABLE "links" ALTER COLUMN "category" SET DEFAULT 'local'`);
  },
  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const query = sequelize.query.bind(sequelize);
    await query(`ALTER TABLE "links" ALTER COLUMN "category" TYPE VARCHAR(50) USING (category::text)`);
  }
};
