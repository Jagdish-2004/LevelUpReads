import Image from "next/image";

interface BookDetailsProps {
  book: {
    _id?: string;
    id?: string;
    title: string;
    authors: string[];
    description: string;
    genres: string[];
    coverImage: string | null;
    averageRating?: number;
    ratingsCount?: number;
    xpValue?: number;
  };
}

export default function BookDetails({ book }: BookDetailsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto w-full mt-10">
      {/* LEFT SIDE: Image */}
      <div className="w-full md:w-1/3 flex justify-center">
        <div className="relative w-full max-w-[300px] aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Cover Available
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Details */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {book.title}
          </h1>
          <button className="px-6 py-2 bg-black text-white rounded-full font-medium hover:opacity-80 transition whitespace-nowrap shadow-md">
            + Add to Favorites
          </button>
        </div>

        <p className="text-xl text-gray-600 mt-2 font-medium">
          {book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author"}
        </p>

        <div className="flex items-center gap-4 mt-4 mb-6">
          <div className="flex items-center gap-1 text-yellow-500 font-semibold text-lg bg-yellow-50 px-3 py-1 rounded-lg">
            <span>★</span>
            <span>{book.averageRating ? book.averageRating.toFixed(1) : "N/A"}</span>
          </div>
          {book.ratingsCount !== undefined && book.ratingsCount > 0 && (
            <span className="text-gray-500 text-sm">
              ({book.ratingsCount} reviews)
            </span>
          )}
          {book.xpValue && (
            <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg">
              +{book.xpValue} XP
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {book.genres && book.genres.length > 0 ? (
            book.genres.map((genre, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                {genre}
              </span>
            ))
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              General
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Summary</h3>
          <div className="text-gray-700 leading-relaxed space-y-4">
            {book.description ? (
              <p>{book.description}</p>
            ) : (
              <p className="italic text-gray-500">No description available for this book.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
