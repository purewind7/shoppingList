import { fireEvent, render, screen } from '@testing-library/react';
import { ItemForm } from './ItemForm';

describe('ItemForm', () => {
  it('renders item suggestions and auto-selects stores from a matched suggestion', () => {
    render(
      <ItemForm
        supermarkets={['Costco', "Trader Joe's", 'General']}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        itemNameSuggestions={[
          { name: 'Milk', supermarket: "Costco, Trader Joe's" },
          { name: 'Bread', supermarket: 'General' },
        ]}
      />
    );

    const input = screen.getByPlaceholderText('e.g. Oat Milk, Apples...');
    fireEvent.change(input, { target: { value: 'Milk' } });

    expect(document.querySelector('datalist#item-name-suggestions option[value="Milk"]')).not.toBeNull();
    expect(screen.getByLabelText('Costco')).toBeChecked();
    expect(screen.getByLabelText("Trader Joe's")).toBeChecked();
  });

  it('submits selected stores as comma-separated string', () => {
    const onSubmit = jest.fn();
    render(
      <ItemForm
        supermarkets={['Costco', "Trader Joe's", 'General']}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Oat Milk, Apples...'), {
      target: { value: 'Eggs' },
    });
    fireEvent.click(screen.getByLabelText('Costco'));
    fireEvent.click(screen.getByLabelText("Trader Joe's"));
    fireEvent.click(screen.getByRole('button', { name: 'Add to List' }));

    expect(onSubmit).toHaveBeenCalledWith('Eggs', "Costco, Trader Joe's");
  });
});
