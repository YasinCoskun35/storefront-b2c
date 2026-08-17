using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed record DeleteProductImageCommand(string ProductId, string ImageId) : IRequest<Result<bool>>;
