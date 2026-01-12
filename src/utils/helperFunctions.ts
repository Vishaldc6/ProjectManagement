export const toCapitalize = (text: string) => {
  const textList = text.trim().split(' ');
  let res = '';
  textList.forEach((t, i) => {
    res += t.trim()[0].toUpperCase() + t.trim().slice(1).toLocaleLowerCase();
    if (textList.length > 1 && i != textList.length - 1) {
      res += ' ';
    }
  });
  return res;
};
