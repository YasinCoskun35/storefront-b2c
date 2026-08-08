using MediatR;
using Storefront.Modules.Content.Core.Application.DTOs;
using Storefront.SharedKernel;

namespace Storefront.Modules.Content.Core.Application.Commands;

public sealed record UpdateStoreSettingsCommand(
    string StoreName,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    string? WhatsAppNumber,
    string? WhatsAppMessage,
    string? InstagramUrl,
    string? FacebookUrl,
    string? LogoUrl,
    IReadOnlyList<SliderSlideDto> Slides
) : IRequest<Result<StoreSettingsDto>>;
