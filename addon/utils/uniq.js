export default function uniq(array) {
  return array.filter((e, i, array) => {
    return array.indexOf(e) === i;
  });
}
