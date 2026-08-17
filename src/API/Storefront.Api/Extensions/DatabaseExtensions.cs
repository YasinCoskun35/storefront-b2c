using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Storefront.Modules.Identity.Infrastructure.Persistence;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.Modules.Content.Infrastructure.Persistence;
using Storefront.Modules.Orders.Infrastructure.Persistence;
using Npgsql;

namespace Storefront.Api.Extensions;

public static class DatabaseExtensions
{
    public static async Task InitializeDatabasesAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;

        const int maxRetries = 5;
        const int delayMilliseconds = 2000;

        for (int retry = 1; retry <= maxRetries; retry++)
        {
            try
            {
                Console.WriteLine($"🔄 Attempting database initialization (attempt {retry}/{maxRetries})...");

                // All modules share one database (schema-isolated). Each context's
                // tables are created from its EF model so the schema always matches
                // the code — no hand-written CREATE TABLE statements to drift.
                await EnsureContextAsync(services.GetRequiredService<IdentityDbContext>(), "identity");

                var catalogDb = services.GetRequiredService<CatalogDbContext>();
                await EnsureContextAsync(catalogDb, "catalog");

                // Backfills columns added to the EF model after the table already
                // existed in production (EnsureCreatedAsync only creates tables once,
                // it never alters an existing one).
                await catalogDb.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE catalog.""ProductImages"" ADD COLUMN IF NOT EXISTS ""GroupId"" varchar(450) NULL;
                    CREATE INDEX IF NOT EXISTS ""IX_ProductImages_GroupId"" ON catalog.""ProductImages"" (""GroupId"");
                ");

                var contentDb = services.GetRequiredService<ContentDbContext>();
                await EnsureContextAsync(contentDb, "content");

                await EnsureContextAsync(services.GetRequiredService<OrdersDbContext>(), "orders");

                // Seed the singleton StoreSettings row (the table itself comes from
                // the EF model above; this just guarantees a default row exists).
                await contentDb.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO content.""StoreSettings"" (""Id"", ""StoreName"", ""SliderSlidesJson"")
                        VALUES ('default', 'Storefront', '[]')
                        ON CONFLICT (""Id"") DO NOTHING;
                ");

                Console.WriteLine("✅ All database schemas and tables initialized successfully");
                return;
            }
            catch (NpgsqlException ex) when (retry < maxRetries)
            {
                Console.WriteLine($"⚠️ Database connection failed (attempt {retry}/{maxRetries}): {ex.Message}");
                Console.WriteLine($"⏳ Waiting {delayMilliseconds}ms before retry...");
                await Task.Delay(delayMilliseconds);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error during database initialization: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (retry == maxRetries)
                {
                    Console.WriteLine("❌ Max retries reached. Make sure PostgreSQL is running:");
                    Console.WriteLine("   docker-compose up -d");
                    throw;
                }
                await Task.Delay(delayMilliseconds);
            }
        }
    }

    /// <summary>
    /// Brings a module's schema up to date. Applies migrations when the context
    /// has any; otherwise creates the context's tables directly from the EF model.
    /// Because every module shares one database, <see cref="RelationalDatabaseFacadeExtensions.EnsureCreatedAsync"/>
    /// only creates tables for the first context it runs for, so for the rest we
    /// create tables from the model when the schema is still empty.
    /// </summary>
    private static async Task EnsureContextAsync(DbContext context, string schema)
    {
        if ((await context.Database.GetPendingMigrationsAsync()).Any())
        {
            Console.WriteLine($"📦 Applying {schema} migrations...");
            await context.Database.MigrateAsync();
        }
        else
        {
            // Creates DB + this context's tables the first time; a no-op afterwards.
            await context.Database.EnsureCreatedAsync();

            var tableCount = await ExecuteScalarAsync<int>(context,
                $"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '{schema}'");

            if (tableCount == 0)
            {
                Console.WriteLine($"🔨 Creating {schema} tables from EF model...");
                var creator = context.GetService<IRelationalDatabaseCreator>();
                await creator.CreateTablesAsync();
            }
        }

        var finalCount = await ExecuteScalarAsync<int>(context,
            $"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '{schema}'");
        Console.WriteLine($"✅ {schema} schema initialized ({finalCount} tables)");
    }

    private static async Task<T> ExecuteScalarAsync<T>(DbContext context, string sql)
    {
        await using var command = context.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;
        await context.Database.OpenConnectionAsync();

        try
        {
            var result = await command.ExecuteScalarAsync();
            return (T)Convert.ChangeType(result ?? 0, typeof(T));
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }
}
