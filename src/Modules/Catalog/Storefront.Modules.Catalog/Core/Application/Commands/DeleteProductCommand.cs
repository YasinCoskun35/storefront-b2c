using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed record DeleteProductCommand(string Id) : IRequest<Result<bool>>;
