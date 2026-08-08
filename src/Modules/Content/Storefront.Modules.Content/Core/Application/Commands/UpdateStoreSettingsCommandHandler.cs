using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Content.Core.Application.DTOs;
using Storefront.Modules.Content.Core.Domain.Entities;
using Storefront.Modules.Content.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Content.Core.Application.Commands;

public sealed class UpdateStoreSettingsCommandHandler : IRequestHandler<UpdateStoreSettingsCommand, Result<StoreSettingsDto>>
{
    private readonly ContentDbContext _context;

    public UpdateStoreSettingsCommandHandler(ContentDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StoreSettingsDto>> Handle(UpdateStoreSettingsCommand request, CancellationToken cancellationToken)
    {
        var settings = await _context.StoreSettings
            .FirstOrDefaultAsync(s => s.Id == StoreSettings.DefaultId, cancellationToken);

        var isNew = settings is null;
        settings ??= new StoreSettings { Id = StoreSettings.DefaultId };

        settings.StoreName = string.IsNullOrWhiteSpace(request.StoreName) ? "Storefront" : request.StoreName.Trim();
        settings.ContactEmail = Trim(request.ContactEmail);
        settings.ContactPhone = Trim(request.ContactPhone);
        settings.Address = Trim(request.Address);
        settings.WhatsAppNumber = NormalizeWhatsApp(request.WhatsAppNumber);
        settings.WhatsAppMessage = Trim(request.WhatsAppMessage);
        settings.InstagramUrl = Trim(request.InstagramUrl);
        settings.FacebookUrl = Trim(request.FacebookUrl);
        settings.LogoUrl = Trim(request.LogoUrl);
        settings.SliderSlidesJson = StoreSettingsMapper.SerializeSlides(request.Slides);
        settings.UpdatedAt = DateTime.UtcNow;

        if (isNew)
        {
            _context.StoreSettings.Add(settings);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<StoreSettingsDto>.Success(StoreSettingsMapper.ToDto(settings));
    }

    private static string? Trim(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>Keep only digits so wa.me links work regardless of how the number was typed.</summary>
    private static string? NormalizeWhatsApp(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var digits = new string(value.Where(char.IsDigit).ToArray());
        return digits.Length == 0 ? null : digits;
    }
}
