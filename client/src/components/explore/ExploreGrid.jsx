import { Link } from "react-router-dom";

function ExploreGrid({ posts }) {
  if (!posts.length) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No Posts Found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

      {posts.map((post) => (
        <Link
          key={post._id}
          to={`/post/${post._id}`}
        >
          <img
            src={
              post.images?.[0] ||
              "https://placehold.co/400x400"
            }
            alt="Post"
            className="w-full h-64 object-cover rounded-xl hover:scale-105 transition"
          />
        </Link>
      ))}

    </div>
  );
}

export default ExploreGrid;