using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Storefront.Modules.Identity.Core.Domain.Entities;

namespace Storefront.Modules.Identity.Infrastructure.Persistence;

public sealed class IdentityDataSeeder
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IdentityDataSeeder> _logger;
    private readonly IConfiguration _configuration;

    public IdentityDataSeeder(IServiceProvider serviceProvider, ILogger<IdentityDataSeeder> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task SeedAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        // Seed roles
        await SeedRolesAsync(roleManager);

        // Seed default admin user
        await SeedAdminUserAsync(userManager);
    }

    private async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        var roles = new[] { "Admin", "Manager", "User" };

        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var role = new ApplicationRole
                {
                    Name = roleName,
                    NormalizedName = roleName.ToUpperInvariant(),
                    Description = $"{roleName} role",
                    CreatedAt = DateTime.UtcNow
                };

                var result = await roleManager.CreateAsync(role);
                if (result.Succeeded)
                {
                    _logger.LogInformation("Role '{RoleName}' created successfully.", roleName);
                }
                else
                {
                    _logger.LogError("Failed to create role '{RoleName}': {Errors}", 
                        roleName, 
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }

    private async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        // Only ever used for local development when no override is configured.
        // Production MUST set Admin__Email / Admin__Password (see docker-compose.prod.yml)
        // — otherwise every deployment would share this same public, well-known login.
        var configuredEmail = _configuration["Admin:Email"];
        var configuredPassword = _configuration["Admin:Password"];
        var adminEmail = string.IsNullOrWhiteSpace(configuredEmail) ? "admin@storefront.com" : configuredEmail;
        var adminPassword = string.IsNullOrWhiteSpace(configuredPassword) ? "AdminPassword123!" : configuredPassword;

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin is not null)
        {
            _logger.LogInformation("Admin user already exists.");
            return;
        }

        if (adminPassword == "AdminPassword123!")
        {
            _logger.LogWarning(
                "Seeding the admin account with the default password. Set Admin__Email and " +
                "Admin__Password before deploying to production.");
        }

        var adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            _logger.LogInformation("Default admin user created successfully with email: {Email}", adminEmail);
        }
        else
        {
            _logger.LogError("Failed to create admin user: {Errors}", 
                string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }
}

