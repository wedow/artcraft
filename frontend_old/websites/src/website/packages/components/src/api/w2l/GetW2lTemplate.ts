import { ApiConfig } from "@storyteller/components";

export interface W2lTemplate {
  template_token: string,
  template_type: string,
  creator_user_token: string,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
  updatable_slug: string,
  title: string,
  description_markdown: string,
  description_rendered_html: string,
  frame_width: number,
  frame_height: number,
  duration_millis: number,
  maybe_image_object_name: string,
  maybe_video_object_name: string,
  creator_set_visibility: string,
  is_public_listing_approved: boolean | null,
  created_at: string,
  updated_at: string,
  maybe_moderator_fields: W2lTemplateModeratorFields | null | undefined,
}

export interface W2lTemplateModeratorFields {
  creator_is_banned: boolean,
  creator_ip_address_creation: string,
  creator_ip_address_last_update: string,
  mod_deleted_at: string | undefined | null,
  user_deleted_at: string | undefined | null,
}

export enum W2lTemplateLookupError {
  NotFound,
  ServerError,
  FrontendError,
}

export type GetW2lTemplateResponse = W2lTemplate | W2lTemplateLookupError;

export function GetW2lTemplateIsOk(response: GetW2lTemplateResponse): response is W2lTemplate {
  return response.hasOwnProperty('template_token');
}

export function GetW2lTemplateIsErr(response: GetW2lTemplateResponse): response is W2lTemplateLookupError {
  return !response.hasOwnProperty('template_token');
}

interface W2lTemplateViewResponsePayload {
  success: boolean,
  error_reason?: string,
  template?: W2lTemplate,
}

export async function GetW2lTemplate(templateToken: string) : Promise<GetW2lTemplateResponse> {
  const endpoint = new ApiConfig().viewW2lTemplate(templateToken);

  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const templatesResponse : W2lTemplateViewResponsePayload = res;

    if (templatesResponse?.success) {
      return templatesResponse.template!;
    } 

    if (templatesResponse?.success === false) {
      if (templatesResponse.error_reason?.includes("not found")) {
        return W2lTemplateLookupError.NotFound;
      } else {
        return W2lTemplateLookupError.ServerError;
      }
    }

    return W2lTemplateLookupError.FrontendError;
  })
  .catch(e => {
    return W2lTemplateLookupError.FrontendError;
  });
}
