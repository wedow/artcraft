import MakeRequest from "../MakeRequest";

export interface EditBetaKeyNoteRequest {
  note?: string;
}

export interface EditBetaKeyNoteResponse {
  success: boolean;
}

export const EditBetaKeyNote = MakeRequest<
  string,
  EditBetaKeyNoteRequest,
  EditBetaKeyNoteResponse,
  {}
>({
  method: "POST",
  routingFunction: (token: string) => `/v1/beta_keys/${token}/note`,
});
