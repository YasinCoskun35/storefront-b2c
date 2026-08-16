using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Catalog.Core.Application.Commands;
using Storefront.Modules.Catalog.Core.Application.Queries;

namespace Storefront.Modules.Catalog.API.Controllers;

[ApiController]
[Route("api/catalog/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories(
        [FromQuery] string? parentId,
        [FromQuery] bool all = false,
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        // Storefront callers get active categories; admin can include inactive.
        bool? isActive = includeInactive ? null : true;
        var query = new GetCategoriesQuery(parentId, isActive, all);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return StatusCode(500, new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "Conflict" => Conflict(new { error = result.Error.Code, message = result.Error.Message }),
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return CreatedAtAction(nameof(GetCategories), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command with { Id = id }, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "Conflict" => Conflict(new { error = result.Error.Code, message = result.Error.Message }),
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(new { id = result.Value });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteCategoryCommand(id), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "Conflict" => Conflict(new { error = result.Error.Code, message = result.Error.Message }),
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }
}

