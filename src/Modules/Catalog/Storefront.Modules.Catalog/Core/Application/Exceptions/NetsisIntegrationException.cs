namespace Storefront.Modules.Catalog.Core.Application.Exceptions;

public sealed class NetsisIntegrationException : Exception
{
    public NetsisIntegrationException(string message) : base(message)
    {
    }

    public NetsisIntegrationException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
