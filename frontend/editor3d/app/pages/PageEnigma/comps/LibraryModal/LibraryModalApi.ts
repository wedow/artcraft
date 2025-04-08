import { MediaFilesApi } from "../../../../Classes/ApiManager/MediaFilesApi";
import {
  FilterMediaClasses,
  FilterMediaType,
  FilterEngineCategories,
} from "../../../../enums";

interface ListUserMediaQuery {
  include_user_uploads?: boolean;
  filter_media_classes?: FilterMediaClasses[];
  filter_media_type?: FilterMediaType[];
  filter_engine_categories?: FilterEngineCategories[];
  page?: number;
  limit?: number;
}

export class LibraryModalApi extends MediaFilesApi {
  constructor() {
    super();
  }

  public async listUserMediaFiles(query: ListUserMediaQuery) {
    return await this.ListUserMediaFiles({
      ...query,
      filter_media_classes: query.filter_media_classes,
      filter_media_type: query.filter_media_type,
      filter_engine_categories: query.filter_engine_categories,
    });
  }
}
