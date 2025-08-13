import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";

export const MidjourneyAccountBlock = () => {
  /*
  const [midjourneySession, setMidjourneySession] = useState<CheckSoraSessionResult| undefined>(undefined);
  const [isCheckingMidjourneySession, setIsCheckingMidjourneySession] = useState(false);

  useSoraLoginListener(() => {
    setIsCheckingMidjourneySession(true);
    CheckSoraSession()
      .then((result) => {
        setMidjourneySession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      })
      .finally(() => setIsCheckingMidjourneySession(false));
  });

  useEffect(() => {
    const fetchSession = async () => {
      setIsCheckingMidjourneySession(true);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { session, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTtlMs) {
            setMidjourneySession(session);
            setIsCheckingMidjourneySession(false);
            return;
          }
        }
        const result = await CheckSoraSession();
        setMidjourneySession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      } catch (e) {
        console.error("Error fetching Sora session", e);
        setMidjourneySession(undefined);
      } finally {
        setIsCheckingMidjourneySession(false);
      }
    };
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheTtlMs]);
  */

  const handleMidjourneyButton = async () => {
    //if (isCheckingMidjourneySession) return;
    //if (midjourneySession?.state === SoraSessionState.Valid) {
    //  setIsCheckingMidjourneySession(true);
    //  await LogoutSoraSession();
    //  setMidjourneySession({state: SoraSessionState.NotSetUp});
    //  localStorage.removeItem(cacheKey);
    //  setIsCheckingMidjourneySession(false);
    //} else {
    //  setIsCheckingMidjourneySession(true);
    //  try {
    //    await invoke("open_sora_login_command");
    //  } catch (e) {
    //  } finally {
    //    setIsCheckingMidjourneySession(false);
    //  }
    //}
    try {
      await invoke("open_midjourney_login_command");
    } catch (e) {
    } finally {
    }
  };

  return(
    <div className="flex justify-between items-center">
      <span>Midjourney Account:</span>
      <pre>{"email@domain.com (later)"}</pre>
      <Button
        //variant={
        //  midjourneySession?.state === SoraSessionState.Valid && !isCheckingMidjourneySession
        //    ? "destructive"
        //    : midjourneySession?.state === SoraSessionState.NotSetUp
        //    ? "primary"
        //    : "secondary"
        //}
        className="h-[30px]"
        onClick={handleMidjourneyButton}
        //disabled={isCheckingMidjourneySession}
      >
        {/*{isCheckingMidjourneySession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : midjourneySession?.state === SoraSessionState.Valid ? (
          "Disconnect"
        ) : (
          "Connect"
        )}*/}
        Connect
      </Button>
    </div>
  )
}