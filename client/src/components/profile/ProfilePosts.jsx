import PostCard from "../post/PostCard";

function ProfilePosts({ posts }) {
  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No Posts Yet
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
        />
      ))}
    </div>
  );
}

export default ProfilePosts;