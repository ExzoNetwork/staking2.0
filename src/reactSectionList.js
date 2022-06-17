import React, {Component} from 'react';
export default class extends Component {
  render() {
    const {
      className,
      style,
      renderItem,
      renderSectionHeader,
      sections,
      keyExtractor,
      id,
    } = this.props;
    let _className = 'sectionlist-container';

    if (className) {
      _className += ' ' + className;
    }

    return React.createElement(
      'div',
      {
        className: _className,
        style: style,
      },
      sections.map((section, index) => {
        return React.createElement(
          'div',
          {
            className: 'section-container',
            id: id(section),
            key: keyExtractor(section, index),
          },
          React.createElement(
            'div',
            {
              className: 'section-header',
            },
            renderSectionHeader(section)
          ),
          React.createElement(
            'div',
            {
              className: 'section-item-container',
            },
            section.data.map((item, index) =>
              React.createElement(
                'div',
                {
                  className: 'section-item',
                  key: index,
                },
                renderItem(item, index)
              )
            )
          ),
          section.description &&
            React.createElement(
              'div',
              {
                className: 'section-description',
              },
              section.description
            )
        );
      })
    );
  }
}
