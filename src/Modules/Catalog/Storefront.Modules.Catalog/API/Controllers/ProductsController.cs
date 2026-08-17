using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Catalog.Core.Application.Commands;
using Storefront.Modules.Catalog.Core.Application.Queries;

namespace Storefront.Modules.Catalog.API.Controllers;

[ApiController]
[Route("api/catalog/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? searchTerm,
        [FromQuery] string? categoryId,
        [FromQuery] string? brandId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? isActive,
        [FromQuery] string? stockStatus,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Enum.TryParse<Storefront.Modules.Catalog.Core.Domain.Enums.StockStatus>(stockStatus, ignoreCase: true, out var parsedStockStatus);

        var query = new SearchProductsQuery(
            searchTerm,
            categoryId,
            brandId,
            minPrice,
            maxPrice,
            isActive,
            string.IsNullOrWhiteSpace(stockStatus) ? null : parsedStockStatus,
            pageNumber,
            pageSize);

        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return StatusCode(500, new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var query = new GetProductDetailsQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductCommand command,
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

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateProductCommand command,
        CancellationToken cancellationToken)
    {
        // The route id is authoritative over the body.
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
        var result = await _mediator.Send(new DeleteProductCommand(id), cancellationToken);

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

    [HttpPost("{id}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(
        string id,
        IFormFile file,
        [FromQuery] bool isPrimary = false,
        CancellationToken cancellationToken = default)
    {
        var command = new UploadProductImageCommand(id, file, isPrimary);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        // Return 202 Accepted as image processing happens in the background
        return Accepted(new
        {
            message = "Image upload queued for processing",
            fileName = result.Value
        });
    }

    [HttpDelete("{id}/images/{imageId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteImage(string id, string imageId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteProductImageCommand(id, imageId), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }

    [HttpPut("{id}/images/{imageId}/primary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetPrimaryImage(string id, string imageId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SetPrimaryProductImageCommand(id, imageId), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }

    [HttpPut("{id}/images/reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReorderImages(
        string id,
        [FromBody] ReorderImagesRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ReorderProductImagesCommand(id, request.ImageIds), cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }

    // Bundle-specific endpoints
    
    [HttpGet("{id}/bundle")]
    public async Task<IActionResult> GetBundleDetails(string id, CancellationToken cancellationToken)
    {
        var query = new GetBundleDetailsQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return Ok(result.Value);
    }
    
    [HttpPost("{id}/components")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddComponentToBundle(
        string id,
        [FromBody] AddComponentRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddComponentToBundleCommand(
            id,
            request.ComponentProductId,
            request.Quantity,
            request.PriceOverride,
            request.IsOptional,
            request.DisplayOrder);
            
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                "Conflict" => Conflict(new { error = result.Error.Code, message = result.Error.Message }),
                "Validation" => BadRequest(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return CreatedAtAction(nameof(GetBundleDetails), new { id }, new { bundleItemId = result.Value });
    }
    
    [HttpDelete("{bundleId}/components/{componentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveComponentFromBundle(
        string bundleId,
        string componentId,
        CancellationToken cancellationToken)
    {
        var command = new RemoveComponentFromBundleCommand(bundleId, componentId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(new { error = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(500, new { error = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }
}

// Request DTOs
public sealed record AddComponentRequest(
    string ComponentProductId,
    int Quantity,
    decimal? PriceOverride = null,
    bool IsOptional = false,
    int DisplayOrder = 0
);

public sealed record ReorderImagesRequest(List<string> ImageIds);

