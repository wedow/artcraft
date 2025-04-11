import React, { createContext } from "react";
import {
	BaseQueueObject,
	GetQueuesResponse,
} from "@storyteller/components/src/api/stats/queues/GetQueues";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { useInferenceJobsPolling, useQueuePoll, useSession } from "hooks";

interface InferenceJobsContextType {
	inferenceJobs?: any;
	byCategory?: any;
	clearJobs?: () => void;
	clearJobsStatus?: FetchStatus;
	enqueue?: any;
	queueStats: GetQueuesResponse;
	someJobsAreDone?: boolean;
	startJobs?: () => void;
}

export const InferenceJobsContext = createContext<InferenceJobsContextType>({
	queueStats: BaseQueueObject(),
});

interface Props {
	children?: any;
}

export default function InferenceJobsProvider({ children }: Props) {
	const { sessionWrapper } = useSession();
	const queueStats = useQueuePoll();
	const {
		byCategory,
		clearJobs,
		clearJobsStatus,
		enqueueInferenceJob,
		inferenceJobs,
		someJobsAreDone,
		startJobs,
	} = useInferenceJobsPolling({ sessionWrapper });

	return (
		<InferenceJobsContext.Provider
			{...{
				value: {
					byCategory,
					clearJobs,
					clearJobsStatus,
					enqueue: enqueueInferenceJob,
					enqueueInferenceJob,
					inferenceJobs,
					someJobsAreDone,
					queueStats,
					startJobs,
				},
			}}
		>
			{children}
		</InferenceJobsContext.Provider>
	);
}
