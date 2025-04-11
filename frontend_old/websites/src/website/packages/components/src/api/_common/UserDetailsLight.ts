/// A common type returned by several endpoints.
/// Basic information to display a user and their avatar.
export interface UserDetailsLight {
  user_token: string,
  /// Username (lowercase)
  username: string,
  /// Username with user-specified capitalization
  display_name: string,
  gravatar_hash: string,
  default_avatar: DefaultAvatarInfo,

}

export interface DefaultAvatarInfo {
  image_index: number,
  color_index: number,
}
