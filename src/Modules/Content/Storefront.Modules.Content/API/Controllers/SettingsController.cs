using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Content.Core.Application.Commands;
using Storefront.Modules.Content.Core.Application.DTOs;
using Storefront.Modules.Content.Core.Application.Queries;

namespace Storefront.Modules.Content.API.Controllers;

[ApiController]
[Route("api/content/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    private const string UploadFolder = "uploads/settings";
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024;

    public SettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Public endpoint: store settings consumed by the storefront
    /// (contact details, WhatsApp, homepage slider).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetStoreSettingsQuery(), cancellationToken);

        if (result.IsFailure)
        {
            return StatusCode(500, new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>Admin endpoint: update store settings.</summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        [FromBody] UpdateStoreSettingsCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return StatusCode(500, new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Admin endpoint: upload an image (slider slide or logo) and get back its URL.
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was provided." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = $"File type '{extension}' is not supported. Allowed: {string.Join(", ", AllowedExtensions)}" });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new { message = $"File exceeds the {MaxFileSize / (1024 * 1024)}MB limit." });
        }

        Directory.CreateDirectory(UploadFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var relativePath = Path.Combine(UploadFolder, fileName);

        await using (var stream = new FileStream(relativePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var url = $"/{relativePath.Replace("\\", "/")}";
        return Ok(new { url });
    }
}
