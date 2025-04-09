FakeYou API
===========

<div class="demo-theme-preview">
  <a data-theme="vue">☀️ light mode</a>
  <a data-theme="dark">🌙 dark mode</a>
</div>

---

[FakeYou.com](https://fakeyou.com) has an API that is freely available for you to use, though it is IP 
rate limited to prevent abuse. 

We provide optional API tokens for use in the HTTP `Authorization:` header 
as a means to bypass rate limiting as well as access your privately uploaded voice models.

[Please reach out to us over Discord](https://discord.gg/H72KFXm) to describe what you're building, 
and we'll see if we can help!

## High level notes

The following details pertain to all of our endpoints. 

### HTTP Response Codes

* **`HTTP 400` - Bad request**, something was wrong with your request. Please consult the docs
  or ask about it in [Discord](https://discord.gg/H72KFXm).
* **`HTTP 401` - Unauthorized**, eg. bad `Authorization:` header or incorrect use of a 
  login-required endpoint.
* **`HTTP 429` - Too many requests**, you're sending too many requests and you'll need to 
  slow things down.
* **`HTTP 500` - Server error**, something went wrong and we messed up. Please let us know.

### Tokens / Primary Key Identifiers

All of the entities in our database model have Crockford-encoded token primary key identifiers. 
We uniquely prefix each entity type to keep tokens recognizably namespaced, but you should 
treat the tokens as *opaque strings*. That is, do not validate the prefix (eg. `U:`) to assert 
that a given token (eg. `U:E00D2RD3ZNZ7P`) is a user. These are only helpful for human debugging, 
and they are subject to change.

## Voice Models & Categories

### Get a list of voices

To download a list of all public voices, make a GET request to the following URL.

Note that the full model details are not available directly from the `/tts/list` API, 
and you'll have to consult the model details API to get usage statistics, etc.

```bash
curl -X GET https://api.fakeyou.com/tts/list | jq
```

Response

```json
[
    {
      // The primary token identifier for the model.
      // This is what you use to reference and utilize the model.
      // These values cannot be edited and will never change.
      "model_token": "TM:pgdraamqpbke",

      // The type of synthesizer (options: tacotron2, glowtts, etc.)
      "tts_model_type": "tacotron2",

      // The primary token identifier of the user that created the model
      "creator_user_token": "U:E00D2RD3ZNZ7P",

      // The username of the creator (always lowercase)
      "creator_username": "vegito1089",

      // The display name of the creator (mixed case)
      "creator_display_name": "Vegito1089",

      // Gravatar.com hash for the user (if available)
      "creator_gravatar_hash": "bb9ba8158540e90f68de0f4fd380e8c6",

      // Name of the model. This is user-specified and typically contains 
      // additional details. Since FakeYou operates kind of like YouTube, 
      // we allow users full reign over the title and also allow multiple 
      // models of the same voice to be uploaded.
      // We may be adding additional fields with stricter conventions to 
      // identify characters, voice actors, etc. in the future.
      "title": "Frieza (Chris Ayres)",

      // IETF BCP 47 language tag.
      // This is the spoken language of the model's speaker / dataset
      // Example values: 'en', 'en-US', 'es-419', 'ja-JP', ...
      "ietf_language_tag": "en-US",

      // The primary language tag of the model's speaker / dataset, 
      // removing all other tag and locale data. 
      // Example values: 'en', 'es', 'ja', ...
      "ietf_primary_language_subtag": "en",

      // Whether the voice is highlighted on FakeYou.com
      "is_front_page_featured": false,

      // Whether the voice is highlighted on Twitch
      // If you're building a Twitch integration, these are good voices 
      // to highlight for streamers.
      "is_twitch_featured": false,

      // FOR APP AND EXTENSION DEVELOPERS
      //
      // This is an optional, but guaranteed unique identifier for the voice. 
      // It's meant to aid in Twitch and Discord applications, eg. if the value
      // here is "mario", you could make the command `/tts mario "Itsa me, Mario"`
      // map to the given voice in your hypothetical TTS application.
      //
      // These values will be specially curated by our staff. Only moderators
      // have the ability to set or edit these values, and by default most voices 
      // will report a null value here. Since FakeYou supports potentially many
      // models for single speakers, we'll make sure to set the best sounding
      // options here and update them whenever necessary.
      //
      // If set, the value will always be lowercase, alphanumeric ASCII characters
      // only. (We don't allow hyphens or underscores since we don't know the parameters 
      // or limitations of your input system. We don't want to create problems for you.)
      //
      // Field type: `string | null`
      "maybe_suggested_unique_bot_command": "frieza",

      // Categories this voice belongs to
      "category_tokens": [
        "CAT:53207996q0v",
        "CAT:dftstewmv3d",
        "CAT:7d9s1fzc15h"
      ],

      // Model upload date
      "created_at": "2022-01-17T01:03:22Z",

      // Model last edit date
      "updated_at": "2022-01-17T01:07:36Z"
    },
    // ...
]
```

### Get a list of voice categories

To download a list of voice categories (useful for building a voice search dropdown), 
use the following API:

```bash
curl -X GET https://api.fakeyou.com/category/list/tts | jq
```

Response (note that categories are a *tree* of categories and subcategories):

```json
{
  "success": true,
  "categories": [
    {
      // The primary key identifier of the category
      "category_token": "CAT:nbfg6v5jsdd",

      // The model type. Other valid values are: "w2l".
      "model_type": "tts",

      // If the category has a parent, this will be populated with the
      // parent category token. You can recursively build a tree if you
      // want to build hierarchical navigation. Or you can exclude parents
      // and just show the leaves.
      "maybe_super_category_token": "CAT:0aezw83sdnp",

      // If the category can have models in it directly
      // If false, the category is only a super category.
      "can_directly_have_models": true,

      // If the model can have children categories.
      // Leaf categories cannot.
      "can_have_subcategories": false,

      // If the category can only be applied by mods. Typically false.
      "can_only_mods_apply": false,

      // The human readable name of the category
      "name": "Aaahh!!! Real Monsters",

      // This will always be populated and you should prefer it for tree-based 
      // dropdowns.
      //
      // This is the name of the category to show in dropdown menus as it may
      // occasionally be contextually different than `name`, eg. it could be 
      // titled "(by Game)" if the category title was "Sonic Voices by Game". 
      "name_for_dropdown": "Aaahh!!! Real Monsters",

      // If the category has been approved by mods for general use.
      // You won't ever see any categories where this is `false`.
      "is_mod_approved": true,

      // When the category was created
      "created_at": "2022-01-09T09:34:25Z",

      // When the category was last edited
      "updated_at": "2022-01-09T09:35:25Z",

      // If the category has been deleted, this will be populated.
      // This is for moderators and you can safely ignore the field 
      // as deleted categories will never be returned in any non-moderator 
      // views.
      "deleted_at": null
    },
    // ...
  ]
}
```

## Generate TTS Audio

### Make a TTS request

To turn text into speech with your desired voice, you'll need to find the appropriate TTS model token 
from the model lookup API. 

For example, `TM:7wbtjphx8h8v` in the following examples is our `Mario *` voice. (A paid voice actor 
that we hired to impersonate Mario).

```bash
curl -X POST 'https://api.fakeyou.com/tts/inference' 

 -H 'Accept: application/json' \
 -H 'Content-Type: application/json' \
 --data-raw '{"uuid_idempotency_token":"entropy","tts_model_token":"TM:7wbtjphx8h8v","inference_text":"Testing"}'
```

A closer look at the request payload,

```json
{
  // The primary key token identifier of the model you want to use. 
  // This can be looked up in the aforementioned list endpoint.
  "tts_model_token": "TM:7wbtjphx8h8v",

  // A random value that can only be used once!
  // 
  // Any subsequent request with the same idempotency token will fail outright.
  // The reason for this is so that frontend "create" APIs won't accidentally resubmit 
  // the same request twice.
  //
  // This payload doesn't have to be a UUID, but we recommend uuid V4 (or a more modern 
  // algorithm that makes better use of entropy). The chances that your request will fail due 
  // to duplicate UUIDs is infinitsimal, so set it and don't worry about it.
  //
  // Notably, the UUID has a maximum length of 36 characters.
  "uuid_idempotency_token": "9cdd9865-0e10-48f0-9a23-861118ec3286",

  // The text to be synthesized into audio.
  // We have a slur filter, but you'll also want to sanitize the input on your end.
  "inference_text": "I'll only say the things you want me to say, and nothing more."
}
```

And the response it gives us back,

```json
{
  // Whether the request was successful
  "success": true,

  // The token to look up the results.
  // You'll use this to poll an API to see if your request has finished processing.
  "inference_job_token": "JTINF:qsy72wnfashhvnkktc16y49cy1"
}
```

### Poll TTS request status

Once you've submitted your TTS request, you'll want to poll for completion using 
the `inference_job_token`.

```bash
curl -X GET 'https://api.fakeyou.com/tts/job/{INFERENCE_JOB_TOKEN}' \
  -H 'Accept: application/json' | jq
```

Or filled out with an actual token from the earlier request,

```bash
curl -X GET 'https://api.fakeyou.com/tts/job/JTINF:qsy72wnfashhvnkktc16y49cy1' \
  -H 'Accept: application/json' | jq
```

The response looks like this while the results are processing,

```json
{
  // Whether the request succeeded
  "success": true,

  // Container for the job state record
  "state": {

    // Simply returns the same job token you supplied
    "job_token": "JTINF:qsy72wnfashhvnkktc16y49cy1",

    // The overall status of the job. 
    // 
    // Job states are as follows:
    //
    //  - "pending": job is waiting to run
    //  - "started": job is processing now
    //  - "complete_success": the job ran to completion
    //        successfully and you have audio results
    //  - "complete_failure": the job failed in a knowably
    //        non-repeatable way and will not be retried.
    //  - "attempt_failed": the job failed once, but it's
    //        recoverable and we'll retry again soon.
    //  - "dead": retry attempts were exhausted and the job
    //        will not be retried further.
    //
    // As a state machine:
    //
    // Pending -> Started -> Complete_Success
    //                    |-> Complete_Failure
    //                    \-> Attempt_Failed -> Started -> { Complete, Failed, Dead }
    "status": "pending",

    // During processing, this may be a human-readable string
    // to describe the execution status. 
    "maybe_extra_status_description": null,

    // The number of attempts we've made to render the audio.
    "attempt_count": 0,

    // If there are results, this is the token you'll use to 
    // look up more details (wav file, spectrogram, duration, 
    // execution statistics, etc.)
    "maybe_result_token": null,

    // If there are results, this will show the path to the 
    // wav file. You can use this to avoid looking up the audio
    // record directly in another API call.
    "maybe_public_bucket_wav_audio_path": null,

    // Voice (tts model) that was used to synthesize the audio.
    "model_token": "TM:7wbtjphx8h8v",

    // The synthesizer architecture
    "tts_model_type": "tacotron2",

    // The name of the model. 
    // This field works the same as the `title` field in the 
    // aforementioned /tts/list request.
    "title": "Mario*",

    // The text that was used to generate the audio.
    "raw_inference_text": "This is a use of the voice",

    // When the TTS request was made.
    "created_at": "2022-02-28T05:39:36Z",

    // When the job status was last updated.
    "updated_at": "2022-02-28T05:39:36Z"
  }
}
```

Here's a successfully completed job:

```json
{
  "success": true,
  "state": {
    "job_token": "JTINF:qsy72wnfashhvnkktc16y49cy1",
    "status": "complete_success",
    "maybe_extra_status_description": "done",
    "attempt_count": 1,
    "maybe_result_token": "TR:tn7gq96wg6httvnq91y4y9fka76nj",
    "maybe_public_bucket_wav_audio_path": "/tts_inference_output/9/c/d/vocodes_9cdd9865-0e10-48f0-9a23-861118ec3286.wav",
    "model_token": "TM:7wbtjphx8h8v",
    "tts_model_type": "tacotron2",
    "title": "Mario*",
    "raw_inference_text": "This is a use of the voice",
    "created_at": "2022-02-28T05:39:36Z",
    "updated_at": "2022-02-28T05:39:51Z"
  }
}
```

### Request audio file

Use the final value of `maybe_public_bucket_wav_audio_path` as the path to the audio file. 

We have an API to look up the current result CDN, but for now you can hardcode the following to avoid extra round trips:

**https://storage.googleapis.com/vocodes-public**

That would make the URL for the audio the following: 

https://storage.googleapis.com/vocodes-public/tts_inference_output/9/c/d/vocodes_9cdd9865-0e10-48f0-9a23-861118ec3286.wav

# Open Source

**FakeYou API Bindings**

* [jgric2 / FakeYou-Wrapper-CSharp](https://github.com/jgric2/FakeYou-Wrapper-CSharp) - 
  C# API wrapper

* [leunamcrack / fakeyou.js](https://github.com/leunamcrack/fakeyou.js) - 
  Node.js module with API token or user session support.

* [shards-7 / fakeyou.py](https://github.com/shards-7/fakeyou.py) - 
  Python client library by thedemonicat#9335

* [rmcpantoja / FakeYouTools](https://github.com/rmcpantoja/FakeYouTools) - 
  AutoIt toolkit by TCF#0969
  

**FakeYou Training Notebooks**

* [justinjohn0306 / FakeYou-Tacotron2-Notebook](https://github.com/justinjohn0306/FakeYou-Tacotron2-Notebook) - 
  Tacotron2 Training and Synthesis Notebooks for FakeYou.com, including HifiGan and Arpabet support. 

**FakeYou Discord Bots**
  
* [MysteryPancake / Discord-TTS](https://github.com/MysteryPancake/Discord-TTS) - 
  a Discord bot you can run in your server that uses FakeYou's API to provide custom text to speech commands.

(More to come!)

# Need help, additional docs, or anything else?

Would you like assistance? Or to see API docs for our other endpoints? (W2L? Talknet? Model upload?) 
We'll be happy to assist, update the docs, and more.

[Please reach out to us in Discord!](https://discord.gg/H72KFXm)

---

<div class="demo-theme-preview">
  <a data-theme="vue">☀️ light mode</a>
  <a data-theme="dark">🌙 dark mode</a>
</div>

<style>
  .demo-theme-preview a {
    padding-right: 10px;
  }

  .demo-theme-preview a:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>

<script>
  // NB: This is a list since I want theme switchers at top and bottom of page.
  var themeSwitchers = Docsify.dom.findAll('.demo-theme-preview');
  var themes = Docsify.dom.findAll('[rel="stylesheet"]');

  themeSwitchers.forEach(function (themeSwitcher) {
    themeSwitcher.onclick = function (e) {
      var title = e.target.getAttribute('data-theme');

      themes.forEach(function (theme) {
        theme.disabled = theme.title !== title;
      });
    };
  })

</script>
