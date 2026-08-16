using MediatR;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Identity.Core.Application.Commands;
using Storefront.Modules.Identity.Core.Application.Queries;
using Storefront.SharedKernel.Web;

namespace Storefront.Modules.Identity.API.Controllers;

[Route("api/identity/users")]
public sealed class UsersController : AdminControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUsersQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return StatusCode(500, new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "Conflict" => Conflict(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(result.Value);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> SetStatus(
        string id,
        [FromBody] SetUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SetUserStatusCommand(id, request.IsActive), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(new { success = true });
    }

    public sealed record SetUserStatusRequest(bool IsActive);
}
