import { ApiManager, ApiResponse } from "./ApiManager.js";
import { UserInfo } from "./models/Users.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

export class UsersApi extends ApiManager {
  private async authFetch<B, T>(
    endpoint: string,
    {
      method,
      body,
    }: {
      method: string;
      body?: B;
    }
  ): Promise<T> {
    const bodyInString = JSON.stringify(body);

    const response = await fetch(endpoint, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: bodyInString,
    });

    const responseData = await response.json();
    return responseData as T;
  }

  public GetSession(): Promise<
    ApiResponse<{
      loggedIn: boolean;
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/session`;
    return this.get<{
      success: boolean;
      logged_in: boolean;
      user?: UserInfo;
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          loggedIn: response.logged_in,
          user: response.user,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public GetUserProfile(username: string): Promise<
    ApiResponse<{
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/user/${username}/profile`;
    console.log("endpoint", endpoint);
    return this.get<{
      success: boolean;
      user?: UserInfo;
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          user: response.user,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async Login({
    usernameOrEmail,
    password,
  }: {
    usernameOrEmail: string;
    password: string;
  }): Promise<ApiResponse<{ signedSession?: string }>> {
    console.log("Logging in with usernameOrEmail:", usernameOrEmail);
    const endpoint = `${this.ApiTargets.BaseApi}/v1/login`;
    const body = {
      username_or_email: usernameOrEmail,
      password: password,
    };

    try {
      console.log("calling auth fetch")
      const response = await this.authFetch<
        { username_or_email: string; password: string },
        {
          success: boolean;
          signed_session?: string;
          error_message?: string;
          error_type?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });
      console.log(response)
      console.log("Auth fetch response!!! above")
      return {
        success: response.success,
        data: response.success
          ? { signedSession: response.signed_session }
          : undefined,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public Logout(): Promise<ApiResponse<null>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/logout`;
    return this.post<null, { success: boolean; error_message?: string }>({
      endpoint: endpoint,
    })
      .then((response) => ({
        success: response.success,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async Signup({
    username,
    email,
    password,
    passwordConfirmation,
  }: {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<ApiResponse<{ signedSession?: string }>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/create_account`;
    const body = {
      email_address: email,
      password,
      password_confirmation: passwordConfirmation,
      username,
    };

    try {
      const response = await this.authFetch<
        {
          username: string;
          email_address: string;
          password: string;
          password_confirmation: string;
        },
        {
          success: boolean;
          signed_session?: string;
          error_fields?: Record<string, string>;
          error_message?: string;
          error_type?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        data: response.success
          ? { signedSession: response.signed_session }
          : undefined,
        errorMessage:
          response.error_message ||
          Object.values(response.error_fields ?? {}).join(", "),
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }
}

(window as any).UsersApi = new UsersApi();