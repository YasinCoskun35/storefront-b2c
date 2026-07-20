using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Storefront.Modules.Catalog.Core.Application.Commands;
using Storefront.Modules.Catalog.Core.Application.Settings;

namespace Storefront.Modules.Catalog.Infrastructure.BackgroundJobs;

/// <summary>
/// Periodically runs a Netsis product + stock sync. No-ops when Netsis is
/// disabled so this is safe to register unconditionally.
/// </summary>
public sealed class NetsisSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly NetsisSettings _settings;
    private readonly ILogger<NetsisSyncBackgroundService> _logger;

    public NetsisSyncBackgroundService(
        IServiceProvider serviceProvider,
        NetsisSettings settings,
        ILogger<NetsisSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _settings = settings;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Netsis Sync Background Service is disabled (Netsis:Enabled=false).");
            return;
        }

        _logger.LogInformation(
            "Netsis Sync Background Service started. Interval: {Minutes} minutes.",
            _settings.SyncIntervalMinutes);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(Math.Max(1, _settings.SyncIntervalMinutes)));

        do
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                var result = await mediator.Send(new SyncNetsisProductsCommand(), stoppingToken);

                if (result.IsFailure)
                {
                    _logger.LogWarning("Scheduled Netsis sync failed: {Message}", result.Error.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error during scheduled Netsis sync.");
            }
        }
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken));

        _logger.LogInformation("Netsis Sync Background Service stopped.");
    }
}
