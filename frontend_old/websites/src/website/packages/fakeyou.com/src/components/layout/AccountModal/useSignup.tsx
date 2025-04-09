import { useContext } from "react";
import { useChanger } from "hooks";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import {
  CreateAccount,
  CreateAccountResponse,
} from "@storyteller/components/src/api/account/CreateAccount";
import { InputValidation, ValidatorCallbacks } from "common/InputValidation";
import { AppStateContext } from "components/providers/AppStateProvider";

enum EmailReasons {
  EmailTaken = "emailTaken",
  Invalid = "invalid",
  TooShort = "tooShort",
  BadInput = "badInput",
}

enum PasswordReasons {
  TooShort = "tooShort",
}

enum PasswordConfirmReasons {
  PasswordMismatch = "passwordMismatch",
  TooShort = "tooShort",
}

enum UsernameReasons {
  ContainsSlurs = "containsSlurs",
  InvalidCharacters = "invalidCharacters",
  IsReserved = "isReserved",
  IsTaken = "isTaken",
  TooLong = "tooLong",
  TooShort = "tooShort",
}

const emailErrors = {
  emailTaken: "Email is taken",
  invalid: "Email is invalid",
  tooShort: "Email is too short",
  badInput: "Bad email input, try another",
};

const passwordErrors = {
  tooShort: "Password is too short",
};

const passwordConfirmErrors = {
  passwordMismatch: "Passwords do not match",
  tooShort: "Password is too short",
};

const usernameErrors = {
  containsSlurs: "Username contains slurs",
  invalidCharacters: "Username has invalid characters",
  isReserved: "Username is reserved",
  isTaken: "Username is taken",
  tooLong: "Username is too long",
  tooShort: "Username is too short",
};

const emailValidator = ({ inputValue }: ValidatorCallbacks) => {
  let reason = "";
  let validation = InputValidation.Neutral;

  if (inputValue.length > 1) {
    if (inputValue.length < 3) {
      validation = InputValidation.Invalid;
      reason = EmailReasons.TooShort;
    } else if (!inputValue.includes("@")) {
      validation = InputValidation.Invalid;
      reason = EmailReasons.Invalid;
    } else {
      validation = InputValidation.Valid;
    }
  }

  return { value: inputValue, reason, validation };
};

const passwordConfirmValidator = ({
  inputValue,
  state,
}: ValidatorCallbacks) => {
  const password = state.password;
  let validation = InputValidation.Neutral;
  let reason = "";

  if (inputValue.length > 1) {
    if (inputValue !== password.value) {
      validation = InputValidation.Invalid;
      reason = PasswordConfirmReasons.PasswordMismatch;
    } else {
      validation = InputValidation.Valid;
      reason = "";
    }
  }

  return { value: inputValue, reason, validation };
};

const passwordValidator = ({ inputValue, state }: ValidatorCallbacks) => {
  const passwordConfirm = state.passwordConfirm;
  let validation = InputValidation.Neutral;
  let reason = "";
  let confirmValidation = InputValidation.Neutral;
  let confirmReason = "";

  if (inputValue.length > 1) {
    if (inputValue.length < 6) {
      validation = InputValidation.Invalid;
      reason = PasswordReasons.TooShort;
    } else {
      validation = InputValidation.Valid;
    }

    if (inputValue !== passwordConfirm.value) {
      confirmValidation = InputValidation.Invalid;
      confirmReason = PasswordConfirmReasons.PasswordMismatch;
    } else {
      confirmValidation = InputValidation.Valid;
      confirmReason = "";
    }
  }

  const additional = {
    passwordConfirm: {
      ...passwordConfirm,
      reason: confirmReason,
      validation: confirmValidation,
    },
  };

  return { additional, value: inputValue, reason, validation };
};

const usernameValidator = ({ inputValue }: ValidatorCallbacks) => {
  let reason = "";
  let validation = InputValidation.Neutral;

  if (inputValue.length > 1) {
    if (inputValue.length < 3) {
      validation = InputValidation.Invalid;
      reason = UsernameReasons.TooShort;
    } else if (inputValue.length > 15) {
      validation = InputValidation.Invalid;
      reason = UsernameReasons.TooLong;
    } else {
      validation = InputValidation.Valid;
    }
  }

  return { value: inputValue, reason, validation };
};

interface Props {
  onSuccess?: (x?: any) => any;
  status: FetchStatus;
  statusSet: (x: FetchStatus) => void;
}

export default function useSignup({ onSuccess, status, statusSet }: Props) {
  const { queryAppState } = useContext(AppStateContext);
  const { allAreValid, setProps, state, update } = useChanger({
    email: {
      errorText: emailErrors,
      validator: emailValidator,
      value: "",
    },
    password: {
      errorText: passwordErrors,
      validator: passwordValidator,
      value: "",
    },
    passwordConfirm: {
      errorText: passwordConfirmErrors,
      validator: passwordConfirmValidator,
      value: "",
    },
    username: {
      errorText: usernameErrors,
      validator: usernameValidator,
      value: "",
    },
  });

  const signup = () => {
    statusSet(FetchStatus.in_progress);
    CreateAccount("", {
      username: state.username.value,
      email_address: state.email.value,
      password: state.password.value,
      password_confirmation: state.passwordConfirm.value,
    }).then((res: CreateAccountResponse) => {
      if (res && res.error_fields && res.error_type) {
        statusSet(FetchStatus.error);
        if (res.error_fields.email_address) {
          switch (res.error_type) {
            case "BadInput":
              return update({
                name: "email",
                reason: EmailReasons.BadInput,
                validation: InputValidation.Invalid,
              });
            case "EmailTaken":
              return update({
                name: "email",
                reason: EmailReasons.EmailTaken,
                validation: InputValidation.Invalid,
              });
          }
          return;
        } else if (res.error_fields.password) {
          switch (res.error_type) {
            case "TooShort":
              update({
                name: "password",
                reason: PasswordReasons.TooShort,
                validation: InputValidation.Invalid,
              });
          }
        } else if (res.error_fields?.username) {
          let updateUsername = (reason: UsernameReasons) =>
            update({
              reason,
              name: "username",
              validation: InputValidation.Invalid,
            });
          switch (res.error_fields.username) {
            case "invalid username characters":
              return updateUsername(UsernameReasons.InvalidCharacters);
            case "username is too long":
              return updateUsername(UsernameReasons.TooLong);
            case "username is taken":
              return updateUsername(UsernameReasons.IsTaken);
            case "username is reserved":
              return updateUsername(UsernameReasons.IsReserved);
            case "username contains slurs":
              return updateUsername(UsernameReasons.ContainsSlurs);
          }
        }
      } else if (res.success) {
        statusSet(FetchStatus.success);
        queryAppState();
        if (onSuccess) onSuccess(res);
      }
    });
  };

  return { allAreValid, setProps, signup, state, update };
}
