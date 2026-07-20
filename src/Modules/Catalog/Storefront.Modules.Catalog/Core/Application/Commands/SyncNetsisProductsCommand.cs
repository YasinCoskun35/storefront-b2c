using MediatR;
using Storefront.Modules.Catalog.Core.Application.DTOs;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

/// <summary>
/// Triggers a full product + stock sync from Netsis into the catalog.
/// </summary>
public sealed record SyncNetsisProductsCommand : IRequest<Result<NetsisSyncResultDto>>;
