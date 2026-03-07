namespace Storefront.Modules.Orders.Core.Domain.Entities;

public class PaymentTransaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string? OrderId { get; set; }
    public string? GuestId { get; set; }

    public string Provider { get; set; } = "Iyzico";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string ConversationId { get; set; } = string.Empty;
    public string? Token { get; set; }
    public string? PaymentPageUrl { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";

    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RawResponse { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum PaymentStatus
{
    Pending = 0,
    Success = 1,
    Failed = 2,
    Cancelled = 3
}
