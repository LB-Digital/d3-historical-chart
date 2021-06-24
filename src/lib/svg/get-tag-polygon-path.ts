// constants
const DEFAULT_TRIANGLE_SIZE = 10;
const DEFAULT_MARGIN = 5;


/**
 * Get polygon path for tag shape (rectangle with triangle on left end)
 *
 * @param height - height of tag
 * @param width - width of tag
 * @param triangleSize - width of triangle
 */
const getTagPolygonPath = (height: number, width: number, triangleSize: number = DEFAULT_TRIANGLE_SIZE): string => {
    const halfHeight = height/2;
    width = width + triangleSize + DEFAULT_MARGIN;

    const points: [number, number][] = [
        [0,0],
        [triangleSize, -halfHeight],
        [width, -halfHeight],
        [width, halfHeight],
        [triangleSize, halfHeight]
    ];

    return points.join(' ');
}

export default getTagPolygonPath;