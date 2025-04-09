// Manipulate meta tags on the document.
export class MetaTags {

  static setVideoUrl(url: string) {
    const property = 'og:video';
    let metaTag = MetaTags.findOrCreateOpenGraphMetaTag(property);
    metaTag.setAttribute('content', url);
  }

  static setTitle(title: string) {
    const property = 'og:title';
    let metaTag = MetaTags.findOrCreateOpenGraphMetaTag(property);
    metaTag.setAttribute('content', title);
  }

  private static findOrCreateOpenGraphMetaTag(propertyName: string) : Element {
    let metaTag = MetaTags.findOpenGraphMetaTag(propertyName);
    if (!metaTag) {
      metaTag = MetaTags.createOpenGraphMetaTag(propertyName);
      document.head.appendChild(metaTag);
    }
    return metaTag;
  }

  private static findOpenGraphMetaTag(propertyName: string) : Element | null {
    const selector = `meta[property="${propertyName}"]`;
    return document.head.querySelector(selector);
  }

  private static createOpenGraphMetaTag(propertyName: string) : Element {
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('property', propertyName)
    return metaTag;
  }
}
