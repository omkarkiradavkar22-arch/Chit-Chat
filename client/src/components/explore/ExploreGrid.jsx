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
    <div className="w-full grid grid-cols-3 gap-[2px]">

      {posts.map((post) => (
        <Link
          key={post._id}
          to={`/post/${post._id}`}
          className="block w-full aspect-[3/4] overflow-hidden bg-gray-200 dark:bg-gray-800"
        >
          <img
            src={
              post.images?.[0] ||
              "https://placehold.co/400x400"
            }
            alt="Post"
            className="w-full h-full object-cover"
          />
        </Link>
      ))}

    </div>
  );
}

export default ExploreGrid;
