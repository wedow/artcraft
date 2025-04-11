import { useStatusPoll } from "hooks";

interface Props {
  value?: any;
}

export default function ServerStatusChecker({ value }: Props) {
  useStatusPoll();
  return null;
};