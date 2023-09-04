export default interface IUserData {
    test: string;
    // breadCollection: {
    //     nonShiny: number;
    //     shiny: number;
    //     squareShiny: number;
    //     golden: number;
    // };
    breadCollection: Record<string, number | undefined>;
}
