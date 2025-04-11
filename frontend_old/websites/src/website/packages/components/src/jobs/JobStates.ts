export enum JobState {
  UNKNOWN, // Only on frontend.
  PENDING,
  STARTED,
  COMPLETE_SUCCESS,
  COMPLETE_FAILURE,
  ATTEMPT_FAILED,
  DEAD,
  CANCELED_BY_USER
}

export function jobStateFromString(jobStateString: string) : JobState {
  switch (jobStateString) {
    case 'pending':
      return JobState.PENDING;
    case 'started':
      return JobState.STARTED;
    case 'complete_success':
      return JobState.COMPLETE_SUCCESS;
    case 'complete_failure':
      return JobState.COMPLETE_FAILURE;
    case 'attempt_failed':
      return JobState.ATTEMPT_FAILED;
    case 'dead':
      return JobState.DEAD;
    case 'cancelled_by_user':
      return JobState.CANCELED_BY_USER;
  }

  return JobState.UNKNOWN;
}


export function jobStateCanChange(jobState: JobState) : boolean {
  switch (jobState) {
    case JobState.UNKNOWN:
    case JobState.PENDING:
    case JobState.STARTED:
    case JobState.ATTEMPT_FAILED:
      return true;
    case JobState.COMPLETE_SUCCESS:
    case JobState.COMPLETE_FAILURE:
    case JobState.DEAD:
    case JobState.CANCELED_BY_USER:
    default:
      return false;
  }
}