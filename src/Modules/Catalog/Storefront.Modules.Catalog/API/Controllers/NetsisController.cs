using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Catalog.Core.Application.Commands;

namespace Storefront.Modules.Catalog.API.Controllers;

[ApiController]
[Route("api/admin/netsis")]
[Authorize(Roles = "Admin")]
public sealed class NetsisController : ControllerBase
{
    private readonly IMediator _mediator;

    public NetsisController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Manually triggers a Netsis product + stock sync.
    /// </summary>
    [HttpPost("sync")]
    public async Task<IActionResult> Sync(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SyncNetsisProductsCommand(), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(result.Value);
    }
}
