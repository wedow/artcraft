-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- TODO: Do an analysis of voice binned by # of paying customers that use it.

-- The most popular models amongst paying subscribers.
-- This should give us insight as to which models subscribers pay us for.
SELECT *
FROM (
         SELECT
             t.token,
             t.title,
             count(*) as use_count,
             t.text_pipeline_type,
             t.ietf_language_tag,
             t.created_at,
             t.user_deleted_at,
             t.mod_deleted_at
         FROM
             tts_inference_jobs as j
                 JOIN
             tts_models as t
             ON
                     t.token = j.model_token
         WHERE j.maybe_creator_user_token IN
               (
                   select distinct user_token
                   from user_subscriptions
               )
           AND
                 j.created_at > ( CURDATE() - INTERVAL 1 DAY )
         GROUP BY t.token
         ORDER BY use_count DESC
     ) as x
     WHERE
        x.use_count > 10;


-- The first voice a paying customer uses
-- TODO: List *all* of the voices a paying customer uses before they subscribe, not just the first.
-- select first row of partially aggregate query: https://stackoverflow.com/a/73157541
SELECT *
FROM (
         SELECT
             t.token,
             t.title,
             count(*) as use_count,
             t.text_pipeline_type,
             t.ietf_language_tag,
             t.created_at,
             t.user_deleted_at,
             t.mod_deleted_at
         FROM tts_models AS t
                  JOIN
              (
                  SELECT
                      model_token
                  FROM (
                           SELECT
                               model_token,
                               maybe_creator_user_token,
                               row_number() over(partition by maybe_creator_user_token order by id asc) as rownum
                           FROM
                               tts_inference_jobs
                           WHERE maybe_creator_user_token IN
                                 (
                                     select distinct user_token
                                     from user_subscriptions
                                     where created_at > (CURDATE() - INTERVAL 2 DAY)
                                 )
                       ) AS x
                  WHERE rownum = 1
                  ORDER BY model_token desc
              ) AS y
              ON t.token = y.model_token
         GROUP BY t.token
     ) AS z
ORDER BY use_count desc

-- The last voice a paying customer uses
-- select first row of partially aggregate query: https://stackoverflow.com/a/73157541
SELECT *
FROM (
    SELECT
      t.token,
      t.title,
      count(*) as use_count,
      t.text_pipeline_type,
      t.ietf_language_tag,
      t.created_at,
      t.user_deleted_at,
      t.mod_deleted_at
    FROM tts_models AS t
    JOIN
        (
            SELECT
                model_token
            FROM (
                SELECT
                    model_token,
                    maybe_creator_user_token,
                    row_number() over(partition by maybe_creator_user_token order by id desc) as rownum
                FROM
                    tts_inference_jobs
                WHERE maybe_creator_user_token IN
                      (
                          select distinct user_token
                          from user_subscriptions
                      )
            ) AS x
            WHERE rownum = 1
            ORDER BY model_token desc
          ) AS y
    ON t.token = y.model_token
    GROUP BY t.token
) AS z
ORDER BY use_count desc

