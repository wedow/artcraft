
// Check if hostname is allowed to display studio features.
// This should allow more frequently landing against production.
export function StudioRolloutHostnameAllowed() : boolean {
    const allowed = StudioRolloutHostnameCheck();
    return allowed;
}

function StudioRolloutHostnameCheck() : boolean {
    //// Do not allow "production" or "staging" domains to use studio yet.
    //// Other domains (local development and feature branches) are allowed.
    //switch (window.location.hostname) {
    //    case 'fakeyou.com':
    //    case 'storyteller.ai':
    //        return false;
    //    default:
    //        return true;
    //}
    return true;
}
