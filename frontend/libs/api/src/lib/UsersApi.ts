import { ApiManager, ApiResponse } from "./ApiManager.js";
import { UserInfo } from "./models/Users.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

interface SignupRequest {
  username: string;
  email_address: string;
  password: string;
  password_confirmation: string;
  signup_source?: string;
}

export class UsersApi extends ApiManager {
  private async authFetch<B, T>(
    endpoint: string,
    {
      method,
      body,
    }: {
      method: string;
      body?: B;
    },
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

    const text = await response.text();
    try {
      const responseData = JSON.parse(text);
      return responseData as T;
    } catch (e) {
      console.error("Failed to parse response as JSON:", text);
      throw new Error(text || `Request failed with status ${response.status}`);
    }
  }

  public GetSession(): Promise<
    ApiResponse<{
      loggedIn: boolean;
      user?: UserInfo;
      onboarding?: {
        email_not_set: boolean;
        email_not_confirmed: boolean;
        password_not_set: boolean;
        username_not_customized: boolean;
      };
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get<{
      success: boolean;
      logged_in: boolean;
      user?: UserInfo & {
        onboarding?: {
          email_not_set: boolean;
          email_not_confirmed: boolean;
          password_not_set: boolean;
          username_not_customized: boolean;
        };
      };
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          loggedIn: response.logged_in,
          user: response.user,
          onboarding: response.user?.onboarding,
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
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/${username}/profile`;
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
    console.log("libs/api - Logging in with usernameOrEmail:", usernameOrEmail);
    const endpoint = `${this.getApiSchemeAndHost()}/v1/login`;
    console.log("libs/api - Login endpoint", endpoint);
    const body = {
      username_or_email: usernameOrEmail,
      password: password,
    };

    try {
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
    const endpoint = `${this.getApiSchemeAndHost()}/v1/logout`;
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
    signupSource,
  }: {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    signupSource?: string;
  }): Promise<ApiResponse<{ signedSession?: string }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/create_account`;
    const body: SignupRequest = {
      email_address: email,
      password,
      password_confirmation: passwordConfirmation,
      username,
    };
    if (!!signupSource) {
      body.signup_source = signupSource;
    }

    try {
      const response = await this.authFetch<
        SignupRequest,
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

  public async GoogleSSO({
    credential,
  }: {
    credential: string;
  }): Promise<ApiResponse<{ usernameNotYetCustomized?: boolean }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/accounts/google_sso`;
    const body = {
      google_credential: credential,
    };

    try {
      const response = await this.authFetch<
        { google_credential: string },
        {
          success: boolean;
          username_not_yet_customized?: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        data: response.success
          ? { usernameNotYetCustomized: response.username_not_yet_customized }
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

  public async ChangePassword({
    password,
    passwordConfirmation,
  }: {
    password: string;
    passwordConfirmation: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/change_password`;
    const body = {
      password,
      password_confirmation: passwordConfirmation,
    };

    try {
      const response = await this.authFetch<
        { password: string; password_confirmation: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async EditEmail({
    emailAddress,
  }: {
    emailAddress: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_email`;
    const body = {
      email_address: emailAddress,
    };

    try {
      const response = await this.authFetch<
        { email_address: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async EditUsername({
    displayName,
  }: {
    displayName: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_username`;
    const body = {
      display_name: displayName,
    };

    try {
      const response = await this.authFetch<
        { display_name: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
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
