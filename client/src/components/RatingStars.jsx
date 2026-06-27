import { FiStar } from 'react-icons/fi';

const RatingStars = ({ rating = 0, count = 0, showCount = true, size = 14 }) => {
    // Ensure rating is between 0 and 5
    const normalizedRating = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 !== 0;

    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                    const isFilled = i < fullStars;
                    const isHalf = !isFilled && i === fullStars && hasHalfStar;

                    return (
                        <FiStar
                            key={i}
                            size={size}
                            className={`${isFilled
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : isHalf
                                        ? 'text-yellow-400 fill-yellow-400 opacity-50'
                                        : 'text-gray-300'
                                }`}
                        />
                    );
                })}
            </div>
            {showCount && (
                <span className="text-sm font-bold text-gray-900 dark:text-white ml-1">
                    {normalizedRating > 0 ? normalizedRating.toFixed(1) : 'No rating'}
                    {count > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">({count} rides)</span>}
                </span>
            )}
        </div>
    );
};

export default RatingStars;
