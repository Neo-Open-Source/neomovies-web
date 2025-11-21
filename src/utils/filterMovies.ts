import type { Movie } from '../types'

export const filterValidMovies = (movies: Movie[]): Movie[] => {
  return movies.filter((movie) => {
    // Check if has poster
    const hasPoster = !!(
      movie.poster_path ||
      movie.posterUrlPreview ||
      movie.posterUrl
    )

    // Check if has title/name
    const hasTitle = !!(
      movie.title ||
      movie.name ||
      movie.nameRu ||
      movie.nameOriginal
    )

    // Check if has year
    const hasYear = !!(
      movie.release_date ||
      movie.first_air_date ||
      movie.year
    )

    // Check if has rating
    const hasRating = !!(
      movie.vote_average ||
      movie.ratingKinopoisk
    )

    // Return true only if all conditions are met
    return hasPoster && hasTitle && hasYear && hasRating
  })
}
