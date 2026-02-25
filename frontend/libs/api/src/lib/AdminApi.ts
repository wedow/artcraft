import { ApiManager, ApiResponse } from "./ApiManager.js";

// ── Response types ──────────────────────────────────────────────────────

export interface AdminUserInfo {
  user_id: string;
  email: string;
  paid_status: "paid" | "not_paid";
  credits_balance: number;
  subscription_plan: string | null;
  subscription_status: string | null;
}

export interface AdjustCreditsResponse {
  user_id: string;
  delta: number;
  credits_balance: number;
  adjustment_id: string;
  created_at: string;
}

// ── API class ───────────────────────────────────────────────────────────

export class AdminApi extends ApiManager {
  /**
   * Look up a single user by email or user_id.
   *
   * GET /v1/admin/user?q=<identifier>
   */
  public async GetAdminUser(
    query: string,
  ): Promise<ApiResponse<AdminUserInfo>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/admin/user`;

    return await this.get<{
      success: boolean;
      user_id?: string;
      email?: string;
      paid_status?: "paid" | "not_paid";
      credits_balance?: number;
      subscription_plan?: string | null;
      subscription_status?: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: { q: query },
    })
      .then((response) => ({
        success: response.success,
        data: response.success
          ? {
              user_id: response.user_id!,
              email: response.email!,
              paid_status: response.paid_status!,
              credits_balance: response.credits_balance!,
              subscription_plan: response.subscription_plan ?? null,
              subscription_status: response.subscription_status ?? null,
            }
          : undefined,
        errorMessage: response.error_message,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  /**
   * Add credits to a user.
   *
   * POST /v1/admin/user/credits/adjust
   */
  public async AdjustCredits({
    userId,
    delta,
    adjustmentReason,
    notes,
  }: {
    userId: string;
    delta: number;
    adjustmentReason: string;
    notes: string;
  }): Promise<ApiResponse<AdjustCreditsResponse>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/admin/user/credits/adjust`;

    return await this.post<
      {
        user_id: string;
        delta: number;
        adjustment_reason: string;
        notes: string;
      },
      {
        success: boolean;
        user_id?: string;
        delta?: number;
        credits_balance?: number;
        adjustment_id?: string;
        created_at?: string;
        error_message?: string;
      }
    >({
      endpoint,
      body: {
        user_id: userId,
        delta,
        adjustment_reason: adjustmentReason,
        notes,
      },
    })
      .then((response) => ({
        success: response.success,
        data: response.success
          ? {
              user_id: response.user_id!,
              delta: response.delta!,
              credits_balance: response.credits_balance!,
              adjustment_id: response.adjustment_id!,
              created_at: response.created_at!,
            }
          : undefined,
        errorMessage: response.error_message,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }
}
